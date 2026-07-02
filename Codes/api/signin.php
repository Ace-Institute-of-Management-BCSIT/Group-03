<?php
header('Content-Type: application/json');
require_once 'db.php';

$data     = json_decode(file_get_contents('php://input'), true);
$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';
$role     = trim($data['role']     ?? '');

if (!$email || !$password || !$role) {
    echo json_encode(["success" => false, "message" => "Please fill in all fields."]);
    exit;
}

$stmt = $conn->prepare("
    SELECT u.id, u.full_name, u.email, u.password_hash, u.role, u.org_name,
           COALESCE(u.email_verified, 1) AS email_verified,
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
    $stmt->close(); $conn->close(); exit;
}

$user = $result->fetch_assoc();
$stmt->close();

if (!password_verify($password, $user['password_hash'])) {
    echo json_encode(["success" => false, "message" => "Incorrect password."]);
    $conn->close(); exit;
}

// Only block login if PHPMailer is set up (meaning real email verification is active)
$mailerReady = file_exists(__DIR__ . '/PHPMailer/PHPMailer.php');
if ($mailerReady && intval($user['email_verified']) === 0) {
    echo json_encode([
        "success"           => false,
        "needsVerification" => true,
        "message"           => "Please verify your email before signing in. Check your inbox for the verification link."
    ]);
    $conn->close(); exit;
}

echo json_encode([
    "success" => true,
    "message" => "Signed in successfully.",
    "user"    => [
        "id"           => intval($user['id']),
        "name"         => $user['full_name'],
        "email"        => $user['email'],
        "role"         => $user['role'],
        "org_name"     => $user['org_name'],
        "ngo_id"       => $user['ngo_id'],
        "ngo_verified" => $user['ngo_id'] !== null ? intval($user['ngo_verified']) : null
    ]
]);

$conn->close();
?>