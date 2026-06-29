<?php

header('Content-Type: application/json');
require_once 'db.php';

$body   = json_decode(file_get_contents('php://input'), true) ?: [];
$params = array_merge($_GET, $body);

$action   = $params['action'] ?? '';
$admin_id = intval($params['admin_id'] ?? 0);

// ── Every action requires a real admin account ──
$check = $conn->prepare("SELECT id FROM users WHERE id = ? AND role = 'admin'");
$check->bind_param("i", $admin_id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Admin access required."]);
    exit;
}
$check->close();

switch ($action) {

    // ── Pending NGO applications waiting for review ──
    case 'pending_ngos': {
        $res = $conn->query("
            SELECT n.id, n.ngo_name, n.reg_number, n.ngo_type, n.focus_area, n.district,
                   n.contact_person, n.email, n.phone, n.description, u.email AS account_email
            FROM ngo n JOIN users u ON u.id = n.user_id
            WHERE n.verified = 0
            ORDER BY n.id DESC
        ");
        $rows = [];
        while ($r = $res->fetch_assoc()) { $r['id'] = intval($r['id']); $rows[] = $r; }
        echo json_encode(["success" => true, "ngos" => $rows]);
        break;
    }

    // ── All verified NGOs ──
    case 'list_ngos': {
        $res = $conn->query("
            SELECT n.id, n.ngo_name, n.focus_area, n.district, n.email, n.verified,
                   (SELECT COUNT(*) FROM cause c WHERE c.ngo_id = n.id) AS campaign_count
            FROM ngo n
            WHERE n.verified = 1
            ORDER BY n.id DESC
        ");
        $rows = [];
        while ($r = $res->fetch_assoc()) {
            $r['id'] = intval($r['id']);
            $r['campaign_count'] = intval($r['campaign_count']);
            $rows[] = $r;
        }
        echo json_encode(["success" => true, "ngos" => $rows]);
        break;
    }

    // ── Approve an NGO + auto-create its default "General Support" campaign ──
    case 'approve_ngo': {
        $ngo_id = intval($params['ngo_id'] ?? 0);
        if (!$ngo_id) { echo json_encode(["success" => false, "message" => "Missing ngo_id"]); break; }

        $upd = $conn->prepare("UPDATE ngo SET verified = 1 WHERE id = ?");
        $upd->bind_param("i", $ngo_id);
        $upd->execute();
        $upd->close();

        // give every newly-approved NGO one general fund so donors can support
        // the organization directly, even before it posts a specific campaign
        $exists = $conn->prepare("SELECT id FROM cause WHERE ngo_id = ? LIMIT 1");
        $exists->bind_param("i", $ngo_id);
        $exists->execute();
        $hasCause = $exists->get_result()->num_rows > 0;
        $exists->close();

        if (!$hasCause) {
            $nameRes = $conn->prepare("SELECT ngo_name FROM ngo WHERE id = ?");
            $nameRes->bind_param("i", $ngo_id);
            $nameRes->execute();
            $ngoRow = $nameRes->get_result()->fetch_assoc();
            $nameRes->close();
            $title = "General Support — " . ($ngoRow['ngo_name'] ?? 'Organization');
            $desc  = "Support this organization's overall work — funds go toward wherever it's needed most.";
            $goal  = 500000;

            $ins = $conn->prepare("
                INSERT INTO cause (ngo_id, title, description, goal_amount, raised_amount, accepts_cash, accepts_items, volunteers_needed, status)
                VALUES (?, ?, ?, ?, 0, 1, 1, 0, 'active')
            ");
            $ins->bind_param("issd", $ngo_id, $title, $desc, $goal);
            $ins->execute();
            $ins->close();
        }

        echo json_encode(["success" => true, "message" => "NGO approved."]);
        break;
    }

    // ── Reject / remove a pending NGO application ──
    case 'reject_ngo': {
        $ngo_id = intval($params['ngo_id'] ?? 0);
        if (!$ngo_id) { echo json_encode(["success" => false, "message" => "Missing ngo_id"]); break; }

        $del = $conn->prepare("DELETE FROM ngo WHERE id = ? AND verified = 0");
        $del->bind_param("i", $ngo_id);
        $del->execute();
        $del->close();

        echo json_encode(["success" => true, "message" => "Application rejected."]);
        break;
    }

    // ── All cash + item donations, most recent first ──
    case 'list_donations': {
        $cash = $conn->query("
            SELECT d.id, u.full_name AS donor, c.title AS cause_title, d.amount, d.frequency, d.payment_status, d.donated_at AS created_at
            FROM donation d
            JOIN users u ON u.id = d.user_id
            JOIN cause c ON c.id = d.cause_id
            ORDER BY d.donated_at DESC
            LIMIT 100
        ");
        $cashRows = [];
        while ($r = $cash->fetch_assoc()) { $r['amount'] = floatval($r['amount']); $cashRows[] = $r; }

        $items = $conn->query("
            SELECT i.id, u.full_name AS donor, c.title AS cause_title, i.items_description,
                   i.meetup_location, i.meetup_time, i.phone, i.created_at
            FROM item_donation i
            JOIN users u ON u.id = i.user_id
            JOIN cause c ON c.id = i.cause_id
            ORDER BY i.created_at DESC
            LIMIT 100
        ");
        $itemRows = [];
        while ($r = $items->fetch_assoc()) { $itemRows[] = $r; }

        echo json_encode(["success" => true, "cash_donations" => $cashRows, "item_donations" => $itemRows]);
        break;
    }

    // ── All users on the platform ──
    case 'list_users': {
        $res = $conn->query("SELECT id, full_name, email, role, org_name FROM users ORDER BY id DESC");
        $rows = [];
        while ($r = $res->fetch_assoc()) { $r['id'] = intval($r['id']); $rows[] = $r; }
        echo json_encode(["success" => true, "users" => $rows]);
        break;
    }

    // ── Remove a user (never lets an admin delete themself or another admin) ──
    case 'delete_user': {
        $user_id = intval($params['user_id'] ?? 0);
        if (!$user_id || $user_id === $admin_id) {
            echo json_encode(["success" => false, "message" => "Invalid user."]);
            break;
        }
        $guard = $conn->prepare("SELECT role FROM users WHERE id = ?");
        $guard->bind_param("i", $user_id);
        $guard->execute();
        $target = $guard->get_result()->fetch_assoc();
        $guard->close();

        if (!$target || $target['role'] === 'admin') {
            echo json_encode(["success" => false, "message" => "That account can't be removed."]);
            break;
        }

        $del = $conn->prepare("DELETE FROM users WHERE id = ?");
        $del->bind_param("i", $user_id);
        $del->execute();
        $del->close();

        echo json_encode(["success" => true, "message" => "User removed."]);
        break;
    }

    default:
        echo json_encode(["success" => false, "message" => "Unknown action."]);
}

$conn->close();
?>