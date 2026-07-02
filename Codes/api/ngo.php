<?php

header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

// ── Input — field names match exactly what ngo.js sends ──
$user_id        = intval($data['user_id'] ?? 0);
$ngo_name       = trim($data['name'] ?? '');
$reg_number     = trim($data['registration_no'] ?? '');
$ngo_type       = $data['type'] ?? '';
$focus_area     = $data['focus'] ?? '';
$district       = trim($data['district'] ?? '');
$contact_person = trim($data['contact'] ?? '');
$email          = trim($data['email'] ?? '');
$phone          = trim($data['phone'] ?? '');
$description    = trim($data['description'] ?? '');

// ── Validation ──
if (
    !$user_id ||
    !$ngo_name ||
    !$reg_number ||
    !$ngo_type ||
    !$focus_area ||
    !$district ||
    !$contact_person ||
    !$email
) {
    echo json_encode([
        "success" => false,
        "message" => "Please fill all required fields"
    ]);
    exit;
}

// ── Prevent the same user_id from submitting two NGO profiles ──
$check = $conn->prepare("SELECT id, verified FROM ngo WHERE user_id = ?");
$check->bind_param("i", $user_id);
$check->execute();
$existing = $check->get_result()->fetch_assoc();
$check->close();

if ($existing) {
    echo json_encode([
        "success" => false,
        "message" => $existing['verified']
            ? "Your organization is already verified."
            : "You've already submitted an NGO application — it's pending review."
    ]);
    $conn->close();
    exit;
}

// ── Insert ──
try {

    $stmt = $conn->prepare("
        INSERT INTO ngo (
            user_id, ngo_name, reg_number, ngo_type, focus_area,
            district, contact_person, email, phone, description, verified
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ");

    $stmt->bind_param(
        "isssssssss",
        $user_id, $ngo_name, $reg_number, $ngo_type, $focus_area,
        $district, $contact_person, $email, $phone, $description
    );

    $stmt->execute();

    echo json_encode([
        "success" => true,
        "message" => "NGO registration submitted successfully"
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database error"
    ]);
}

$conn->close();
?>
