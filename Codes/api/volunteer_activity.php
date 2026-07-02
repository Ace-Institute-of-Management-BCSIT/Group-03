<?php
// api/volunteer_activity.php — GET ?user_id=X — volunteer profile + applications
header('Content-Type: application/json');
require_once 'db.php';

$user_id = intval($_GET['user_id'] ?? 0);
if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit;
}

$profStmt = $conn->prepare("SELECT id, phone, district, availability, skills, status FROM volunteer WHERE user_id = ?");
$profStmt->bind_param("i", $user_id);
$profStmt->execute();
$profile = $profStmt->get_result()->fetch_assoc();
$profStmt->close();

$applications = [];
if ($profile) {
    $volunteer_id = intval($profile['id']);
    $appStmt = $conn->prepare("
        SELECT va.id, va.opportunity, va.availability, va.message, va.status, va.applied_at,
               c.title AS cause_title, n.ngo_name
        FROM volunteer_application va
        LEFT JOIN cause c ON c.id = va.cause_id
        LEFT JOIN ngo n ON n.id = va.ngo_id
        WHERE va.volunteer_id = ?
        ORDER BY va.applied_at DESC
    ");
    $appStmt->bind_param("i", $volunteer_id);
    $appStmt->execute();
    $res = $appStmt->get_result();
    while ($r = $res->fetch_assoc()) { $applications[] = $r; }
    $appStmt->close();
}

echo json_encode([
    "success" => true,
    "profile" => $profile ?: null,
    "applications" => $applications
]);

$conn->close();
?>
