<?php
// volunteer_register.php — creates/updates a volunteer profile (the "Quick Registration" form)
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$user_id      = intval($data['user_id'] ?? 0);
$phone        = trim($data['phone'] ?? '');
$district     = trim($data['district'] ?? '');
$availability = trim($data['avail'] ?? '');   // volunteer.js sends "avail"
$skills       = trim($data['skills'] ?? '');

// avoid sending '' into the strict `availability` ENUM column — NULL is allowed, '' is not
if ($availability === '') $availability = null;
if ($district === '') $district = null;
if ($phone === '') $phone = null;

if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Please sign in first."]);
    exit;
}

// One profile per user — update if it already exists, otherwise insert
$check = $conn->prepare("SELECT id FROM volunteer WHERE user_id = ?");
$check->bind_param("i", $user_id);
$check->execute();
$existing = $check->get_result()->fetch_assoc();
$check->close();

if ($existing) {
    $stmt = $conn->prepare("UPDATE volunteer SET phone = ?, district = ?, availability = ?, skills = ? WHERE user_id = ?");
    $stmt->bind_param("ssssi", $phone, $district, $availability, $skills, $user_id);
} else {
    $stmt = $conn->prepare("INSERT INTO volunteer (user_id, phone, district, availability, skills) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issss", $user_id, $phone, $district, $availability, $skills);
}

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "your volunteer profile has been saved!"]);
} else {
    echo json_encode(["success" => false, "message" => "Could not save your profile. Please try again."]);
}

$stmt->close();
$conn->close();
?>