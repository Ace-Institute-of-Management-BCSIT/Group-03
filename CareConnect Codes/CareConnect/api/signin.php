<?php
// signin.php — authenticates an existing user
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$role     = trim($data['role'] ?? '');

if (!$email || !$password || !$role) {
    echo json_encode(["success" => false, "message" => "Please fill in all fields."]);
    exit;
}

$stmt = $conn->prepare("
    SELECT u.id, u.full_name, u.email, u.password_hash, u.role, u.org_name,
           n.id AS ngo_id, n.verified AS ngo_verified
    FROM users u
    LEFT JOIN ngo n ON n.user_id = u.id
    WHERE u.email = ? AND u.role = ?
");
$stmt->bind_param("ss", $email, $role);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "No account found with that email and role."]);
    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password_hash'])) {
    echo json_encode(["success" => false, "message" => "Incorrect password."]);
    $stmt->close();
    $conn->close();
    exit;
}

// shared.js expects user.name, user.role at minimum
echo json_encode([
    "success" => true,
    "message" => "Signed in successfully.",
    "user" => [
        "id"           => $user['id'],
        "name"         => $user['full_name'],
        "email"        => $user['email'],
        "role"         => $user['role'],
        "org_name"     => $user['org_name'],
        "ngo_id"       => $user['ngo_id'],                       // null if not registered yet
        "ngo_verified" => $user['ngo_id'] !== null ? intval($user['ngo_verified']) : null
    ]
]);

$stmt->close();
$conn->close();
?>