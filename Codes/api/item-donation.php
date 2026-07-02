<?php
// item-donation.php — saves a request to drop off donated items/goods
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$user_id  = intval($data['user_id'] ?? 0);
$cause_id = intval($data['cause_id'] ?? 0);
$desc     = trim($data['items_description'] ?? '');
$location = trim($data['meetup_location'] ?? '');
$time     = trim($data['meetup_time'] ?? '');   // comes in as "YYYY-MM-DDTHH:MM" from <input type="datetime-local">
$phone    = trim($data['phone'] ?? '');

if (!$user_id || !$cause_id || !$desc || !$location || !$time || !$phone) {
    echo json_encode(["success" => false, "message" => "Please fill in all fields."]);
    exit;
}

// Confirm the cause exists
$check = $conn->prepare("SELECT id FROM cause WHERE id = ?");
$check->bind_param("i", $cause_id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Selected cause was not found."]);
    $check->close();
    $conn->close();
    exit;
}
$check->close();

// Convert "2026-06-25T15:30" -> "2026-06-25 15:30:00" for MySQL DATETIME
$meetup_time = str_replace('T', ' ', $time) . ':00';

$stmt = $conn->prepare("INSERT INTO item_donation (user_id, cause_id, items_description, meetup_location, meetup_time, phone) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("iissss", $user_id, $cause_id, $desc, $location, $meetup_time, $phone);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Meetup request submitted."]);
} else {
    echo json_encode(["success" => false, "message" => "Could not submit your request. Please try again."]);
}

$stmt->close();
$conn->close();
?>