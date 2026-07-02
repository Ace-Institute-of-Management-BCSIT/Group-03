<?php
// api/verify.php — visited when the user clicks the link in their email.
require_once 'db.php';

$token = trim($_GET['token'] ?? '');
$email = trim($_GET['email'] ?? '');

function render_result($title, $message, $ok) {
    $color = $ok ? '#2E7D32' : '#C62828';
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>{$title}</title>
    <style>
        body{font-family:Inter,Arial,sans-serif;background:#F5F9FF;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
        .box{background:#fff;padding:40px 36px;border-radius:20px;box-shadow:0 8px 32px rgba(21,101,192,0.12);text-align:center;max-width:420px;}
        h2{color:{$color};margin-bottom:10px;}
        p{color:#4A627A;line-height:1.6;}
        a{display:inline-block;margin-top:18px;background:#1565C0;color:#fff;padding:12px 26px;border-radius:30px;text-decoration:none;font-weight:700;}
    </style></head><body>
    <div class='box'><h2>{$title}</h2><p>{$message}</p><a href='../index.html'>Go to CareConnect →</a></div>
    </body></html>";
}

if (!$token || !$email) {
    render_result('Invalid link', 'This verification link is missing required information.', false);
    exit;
}

$stmt = $conn->prepare("SELECT id, email_verified, verify_token, verify_expires FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user) {
    render_result('Account not found', 'We could not find an account for this email address.', false);
    exit;
}

if (intval($user['email_verified']) === 1) {
    render_result('Already verified', 'This account is already verified. You can sign in now.', true);
    exit;
}

if (!hash_equals((string)$user['verify_token'], $token)) {
    render_result('Invalid link', 'This verification link is invalid. Please request a new one.', false);
    exit;
}

if (strtotime($user['verify_expires']) < time()) {
    render_result('Link expired', 'This verification link has expired. Please sign up again or request a new link.', false);
    exit;
}

$upd = $conn->prepare("UPDATE users SET email_verified = 1, verify_token = NULL, verify_expires = NULL WHERE id = ?");
$upd->bind_param("i", $user['id']);
$upd->execute();
$upd->close();

render_result('Email verified! 🎉', 'Your CareConnect account is now active. You can sign in.', true);
$conn->close();
?>
