<?php

header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$fname      = trim($data['first_name'] ?? '');
$lname      = trim($data['last_name'] ?? '');
$email      = trim($data['email'] ?? '');
$phone      = trim($data['phone'] ?? '');
$role       = trim($data['role'] ?? '');
$topic      = trim($data['topic'] ?? 'General inquiry');
$message    = trim($data['message'] ?? '');
$newsletter = !empty($data['newsletter']) ? 1 : 0;

if (!$fname || !$lname || !$email || !$message) {
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
    exit;
}

// NOTE: this table is named contact_message (singular) and has no user_id column
$stmt = $conn->prepare("INSERT INTO contact_message
    (topic, first_name, last_name, email, phone, role, message, newsletter)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Server error: " . $conn->error]);
    exit;
}

$stmt->bind_param("sssssssi", $topic, $fname, $lname, $email, $phone, $role, $message, $newsletter);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Message sent successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Could not send your message: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>