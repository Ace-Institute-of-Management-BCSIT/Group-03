<?php
// api/resend_verification.php — issues a fresh verification token + email
header('Content-Type: application/json');
require_once 'db.php';
require_once 'mailer.php';

$data  = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode(["success" => false, "message" => "Please enter your email."]);
    exit;
}

$stmt = $conn->prepare("SELECT id, full_name, email_verified FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(["success" => false, "message" => "No account found with that email."]);
    exit;
}
if (intval($user['email_verified']) === 1) {
    echo json_encode(["success" => false, "message" => "This account is already verified — you can sign in."]);
    exit;
}

$verify_token   = bin2hex(random_bytes(32));
$verify_expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

$upd = $conn->prepare("UPDATE users SET verify_token = ?, verify_expires = ? WHERE id = ?");
$upd->bind_param("ssi", $verify_token, $verify_expires, $user['id']);
$upd->execute();
$upd->close();

$sent = send_verification_email($email, $user['full_name'], $verify_token);

echo json_encode([
    "success" => $sent,
    "message" => $sent ? "Verification email resent — please check your inbox." : "Could not send the email right now. Please try again later."
]);

$conn->close();
?>
