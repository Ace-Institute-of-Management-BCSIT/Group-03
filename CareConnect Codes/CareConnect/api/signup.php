<?php
// signup.php — creates a new user account
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$full_name = trim($data['full_name'] ?? '');
$email     = trim($data['email'] ?? '');
$password  = $data['password'] ?? '';
$role      = trim($data['role'] ?? '');
$org_name  = trim($data['org_name'] ?? '');
$org_name  = $org_name === '' ? null : $org_name;

// Basic validation
if (!$full_name || !$email || !$password || !$role) {
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode(["success" => false, "message" => "Password must be at least 8 characters."]);
    exit;
}

$valid_roles = ['donor', 'volunteer', 'ngo', 'admin'];
if (!in_array($role, $valid_roles)) {
    echo json_encode(["success" => false, "message" => "Invalid role selected."]);
    exit;
}

if ($role === 'ngo' && !$org_name) {
    echo json_encode(["success" => false, "message" => "Organization name is required for NGO accounts."]);
    exit;
}

// Check if email already exists
$check = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "An account with this email already exists."]);
    $check->close();
    $conn->close();
    exit;
}
$check->close();

// Hash password and insert
$password_hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO users (full_name, email, password_hash, role, org_name) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $full_name, $email, $password_hash, $role, $org_name);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Account created successfully!"]);
} else {
    echo json_encode(["success" => false, "message" => "Something went wrong. Please try again."]);
}

$stmt->close();
$conn->close();
?>