<?php
// api/ngo_profile.php
//   GET  ?id=X        -> public NGO profile + its campaigns + stats
//   GET  ?name=...     -> same, looked up by ngo_name (for the hardcoded showcase cards)
//   GET  ?user_id=X    -> the NGO profile owned by this user account (for dashboards)
//   POST { user_id, ...fields } -> owner updates their own profile
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id      = intval($_GET['id'] ?? 0);
    $name    = trim($_GET['name'] ?? '');
    $user_id = intval($_GET['user_id'] ?? 0);

    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM ngo WHERE id = ?");
        $stmt->bind_param("i", $id);
    } elseif ($name) {
        $stmt = $conn->prepare("SELECT * FROM ngo WHERE ngo_name = ?");
        $stmt->bind_param("s", $name);
    } elseif ($user_id) {
        $stmt = $conn->prepare("SELECT * FROM ngo WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
    } else {
        echo json_encode(["success" => false, "message" => "Provide id, name, or user_id."]);
        exit;
    }

    $stmt->execute();
    $ngo = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$ngo) {
        echo json_encode(["success" => false, "message" => "NGO not found."]);
        exit;
    }

    $ngoId = intval($ngo['id']);
    $causes = [];
    $cStmt = $conn->prepare("SELECT id, title, description, goal_amount, raised_amount, category, district, status, volunteers_needed FROM cause WHERE ngo_id = ? ORDER BY created_at DESC");
    $cStmt->bind_param("i", $ngoId);
    $cStmt->execute();
    $res = $cStmt->get_result();
    $totalRaised = 0;
    while ($r = $res->fetch_assoc()) {
        $r['goal_amount']   = floatval($r['goal_amount']);
        $r['raised_amount'] = floatval($r['raised_amount']);
        $totalRaised += $r['raised_amount'];
        $causes[] = $r;
    }
    $cStmt->close();

    $volStmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM volunteer_application WHERE ngo_id = ?");
    $volStmt->bind_param("i", $ngoId);
    $volStmt->execute();
    $volCount = intval($volStmt->get_result()->fetch_assoc()['cnt']);
    $volStmt->close();

    echo json_encode([
        "success" => true,
        "ngo" => $ngo,
        "causes" => $causes,
        "stats" => [
            "total_raised" => $totalRaised,
            "campaign_count" => count($causes),
            "volunteer_applications" => $volCount
        ]
    ]);
    $conn->close();
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = intval($data['user_id'] ?? 0);

    if (!$user_id) {
        echo json_encode(["success" => false, "message" => "Please sign in first."]);
        exit;
    }

    $check = $conn->prepare("SELECT id FROM ngo WHERE user_id = ?");
    $check->bind_param("i", $user_id);
    $check->execute();
    $row = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$row) {
        echo json_encode(["success" => false, "message" => "No NGO profile found for this account."]);
        exit;
    }
    $ngoId = intval($row['id']);

    $contact_person = trim($data['contact_person'] ?? '');
    $phone          = trim($data['phone'] ?? '');
    $description    = trim($data['description'] ?? '');
    $district       = trim($data['district'] ?? '');

    $stmt = $conn->prepare("UPDATE ngo SET contact_person = COALESCE(NULLIF(?, ''), contact_person), phone = COALESCE(NULLIF(?, ''), phone), description = COALESCE(NULLIF(?, ''), description), district = COALESCE(NULLIF(?, ''), district) WHERE id = ?");
    $stmt->bind_param("ssssi", $contact_person, $phone, $description, $district, $ngoId);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Profile updated."]);
    } else {
        echo json_encode(["success" => false, "message" => "Could not update profile."]);
    }
    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Unsupported method."]);
?>
