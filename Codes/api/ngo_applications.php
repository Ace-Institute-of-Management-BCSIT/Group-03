<?php
// api/ngo_applications.php — GET ?user_id=X — all volunteer applications
// received across this NGO's campaigns, with applicant contact info.
header('Content-Type: application/json');
require_once 'db.php';

$user_id = intval($_GET['user_id'] ?? 0);
if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit;
}

$ngoStmt = $conn->prepare("SELECT id FROM ngo WHERE user_id = ?");
$ngoStmt->bind_param("i", $user_id);
$ngoStmt->execute();
$ngo = $ngoStmt->get_result()->fetch_assoc();
$ngoStmt->close();

if (!$ngo) {
    echo json_encode(["success" => false, "message" => "No NGO profile found."]);
    exit;
}
$ngoId = intval($ngo['id']);

$stmt = $conn->prepare("
    SELECT va.id, va.opportunity, va.availability, va.message, va.status, va.applied_at,
           u.full_name AS applicant_name, u.email AS applicant_email, v.phone AS applicant_phone,
           c.title AS cause_title
    FROM volunteer_application va
    JOIN volunteer v ON v.id = va.volunteer_id
    JOIN users u ON u.id = v.user_id
    LEFT JOIN cause c ON c.id = va.cause_id
    WHERE va.ngo_id = ?
    ORDER BY va.applied_at DESC
");
$stmt->bind_param("i", $ngoId);
$stmt->execute();
$res = $stmt->get_result();
$rows = [];
while ($r = $res->fetch_assoc()) { $rows[] = $r; }
$stmt->close();

echo json_encode(["success" => true, "applications" => $rows]);
$conn->close();
?>
