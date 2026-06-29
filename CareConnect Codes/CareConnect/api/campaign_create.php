<?php
// campaign_create.php — a verified NGO posts a new campaign
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$user_id           = intval($data['user_id'] ?? 0);
$title             = trim($data['title'] ?? '');
$description       = trim($data['description'] ?? '');
$category          = trim($data['category'] ?? '');
$district          = trim($data['district'] ?? '');
$goal_amount       = floatval($data['goal_amount'] ?? 0);
$accepts_cash      = !empty($data['accepts_cash']) ? 1 : 0;
$accepts_items     = !empty($data['accepts_items']) ? 1 : 0;
$volunteers_needed = intval($data['volunteers_needed'] ?? 0);

if (!$user_id || !$title || !$description || $goal_amount <= 0) {
    echo json_encode(["success" => false, "message" => "Please fill in title, description, and a goal amount."]);
    exit;
}
if (!$accepts_cash && !$accepts_items && !$volunteers_needed) {
    echo json_encode(["success" => false, "message" => "Choose at least one way for people to help: cash, items, or volunteers."]);
    exit;
}

// Confirm this user is a VERIFIED NGO before letting them post
$check = $conn->prepare("SELECT id, verified, ngo_name FROM ngo WHERE user_id = ?");
$check->bind_param("i", $user_id);
$check->execute();
$ngo = $check->get_result()->fetch_assoc();
$check->close();

if (!$ngo) {
    echo json_encode(["success" => false, "message" => "No NGO profile found for this account."]);
    exit;
}
if (!intval($ngo['verified'])) {
    echo json_encode(["success" => false, "message" => "Your organization is still pending verification. You can post campaigns once approved."]);
    exit;
}

$ngo_id = intval($ngo['id']);

$stmt = $conn->prepare("
    INSERT INTO cause (ngo_id, title, description, goal_amount, raised_amount, category, district, accepts_cash, accepts_items, volunteers_needed, status)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'active')
");
$stmt->bind_param("issdssiii", $ngo_id, $title, $description, $goal_amount, $category, $district, $accepts_cash, $accepts_items, $volunteers_needed);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Campaign \"$title\" is now live!"]);
} else {
    echo json_encode(["success" => false, "message" => "Could not create the campaign. Please try again."]);
}

$stmt->close();
$conn->close();
?>