<?php
// campaigns_list.php — GET list of campaigns (causes posted by NGOs)
header('Content-Type: application/json');
require_once 'db.php';

$ngo_user_id = isset($_GET['ngo_user_id']) ? intval($_GET['ngo_user_id']) : null;

if ($ngo_user_id) {
    // ── "My Campaigns" — everything this NGO has posted, any status ──
    $stmt = $conn->prepare("
        SELECT c.id, c.title, c.description, c.goal_amount, c.raised_amount, c.category,
               c.district, c.accepts_cash, c.accepts_items, c.volunteers_needed, c.status,
               (SELECT COUNT(*) FROM volunteer_application va WHERE va.cause_id = c.id) AS applicant_count
        FROM cause c
        JOIN ngo n ON n.id = c.ngo_id
        WHERE n.user_id = ?
        ORDER BY c.created_at DESC
    ");
    $stmt->bind_param("i", $ngo_user_id);
    $stmt->execute();
    $result = $stmt->get_result();
} else {

    $stmt = $conn->prepare("
        SELECT c.id, c.title, c.description, c.goal_amount, c.raised_amount, c.category,
               c.district, c.accepts_cash, c.accepts_items, c.volunteers_needed, c.status,
               n.ngo_name, n.district AS ngo_district,
               (SELECT COUNT(*) FROM volunteer_application va WHERE va.ngo_id = c.ngo_id) AS ngo_volunteer_count
        FROM cause c
        JOIN ngo n ON n.id = c.ngo_id
        WHERE c.status = 'active'
        ORDER BY c.created_at DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();
}

$campaigns = [];
while ($row = $result->fetch_assoc()) {
    $row['id']                 = intval($row['id']);
    $row['goal_amount']        = floatval($row['goal_amount']);
    $row['raised_amount']      = floatval($row['raised_amount']);
    $row['accepts_cash']       = intval($row['accepts_cash']);
    $row['accepts_items']      = intval($row['accepts_items']);
    $row['volunteers_needed']  = intval($row['volunteers_needed']);
    if (isset($row['applicant_count'])) $row['applicant_count'] = intval($row['applicant_count']);
    if (isset($row['ngo_volunteer_count'])) $row['ngo_volunteer_count'] = intval($row['ngo_volunteer_count']);
    $campaigns[] = $row;
}

echo json_encode(["success" => true, "campaigns" => $campaigns]);

$stmt->close();
$conn->close();
?>