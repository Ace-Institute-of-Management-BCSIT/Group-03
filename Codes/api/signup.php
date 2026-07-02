<?php
header('Content-Type: application/json');
require_once 'db.php';

$data      = json_decode(file_get_contents('php://input'), true);
$full_name = trim($data['full_name'] ?? '');
$email     = trim($data['email']     ?? '');
$password  = $data['password']       ?? '';
$role      = trim($data['role']      ?? '');
$org_name  = trim($data['org_name']  ?? '');
$org_name  = $org_name === '' ? null : $org_name;

if (!$full_name || !$email || !$password || !$role) {
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Please enter a valid email address."]);
    exit;
}
if (strlen($password) < 8) {
    echo json_encode(["success" => false, "message" => "Password must be at least 8 characters."]);
    exit;
}
if (!in_array($role, ['donor','volunteer','ngo','admin'])) {
    echo json_encode(["success" => false, "message" => "Invalid role selected."]);
    exit;
}
if ($role === 'ngo' && !$org_name) {
    echo json_encode(["success" => false, "message" => "Organization name is required for NGO accounts."]);
    exit;
}

// Block duplicate emails
$check = $conn->prepare("SELECT id, email_verified FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$existing = $check->get_result()->fetch_assoc();
$check->close();

if ($existing) {
    if (intval($existing['email_verified']) === 0) {
        echo json_encode(["success" => false, "message" => "This email is registered but not verified. Check your inbox or resend the link.", "canResend" => true, "email" => $email]);
    } else {
        echo json_encode(["success" => false, "message" => "An account with this email already exists. Please sign in instead."]);
    }
    $conn->close(); exit;
}

$password_hash  = password_hash($password, PASSWORD_DEFAULT);
$verify_token   = bin2hex(random_bytes(32));
$verify_expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

$stmt = $conn->prepare("INSERT INTO users (full_name, email, password_hash, role, org_name, email_verified, verify_token, verify_expires) VALUES (?, ?, ?, ?, ?, 0, ?, ?)");
$stmt->bind_param("sssssss", $full_name, $email, $password_hash, $role, $org_name, $verify_token, $verify_expires);

if (!$stmt->execute()) {
    echo json_encode(["success" => false, "message" => "Could not create account: " . $conn->error]);
    $stmt->close(); $conn->close(); exit;
}
$stmt->close();

// Send verification email
require_once 'mailer.php';
$mailSent = send_verification_email($email, $full_name, $verify_token);

echo json_encode([
    "success"           => true,
    "needsVerification" => true,
    "mailSent"          => $mailSent,
    "sentTo"            => $email,
    "message"           => $mailSent
        ? "Account created! Verification link sent to {$email}. Please check your inbox (and spam folder)."
        : "Account created but email failed to send. Please contact support."
]);

$conn->close();
?>