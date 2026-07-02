<?php
define('SMTP_USER',      'butterflysly089@gmail.com');
define('SMTP_PASS',      'ymswpeglotgosmby'); // KEEP YOUR ACTUAL PASSWORD HERE
define('SMTP_FROM_NAME', 'CareConnect');
define('SITE_BASE_URL',  'http://localhost/CareConnect');

$_phpmailerDir = __DIR__ . '/PHPMailer/';
require_once $_phpmailerDir . 'Exception.php';
require_once $_phpmailerDir . 'PHPMailer.php';
require_once $_phpmailerDir . 'SMTP.php';

function send_email(string $toEmail, string $toName, string $subject, string $htmlBody): bool {
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
        $mail->addAddress($toEmail, $toName);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = strip_tags($htmlBody);

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log('Mailer error: ' . $e->getMessage());
        return false;
    }
}

function send_verification_email(string $toEmail, string $toName, string $token): bool {
    $link    = SITE_BASE_URL . '/api/verify.php?token=' . urlencode($token) . '&email=' . urlencode($toEmail);
    $subject = 'Verify your CareConnect account';
    $body    = "
        <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;'>
            <h2 style='color:#1565C0;'>Welcome to CareConnect, {$toName}!</h2>
            <p>Please verify your email to activate your account.</p>
            <p style='margin:28px 0;'>
                <a href='{$link}' style='background:#1565C0;color:#fff;padding:14px 28px;border-radius:30px;text-decoration:none;font-weight:700;'>Verify my email →</a>
            </p>
            <p style='color:#666;font-size:13px;'>Or copy this link:<br><a href='{$link}'>{$link}</a></p>
            <p style='color:#999;font-size:12px;'>Link expires in 24 hours.</p>
        </div>";
    return send_email($toEmail, $toName, $subject, $body);
}
?>

function send_donation_thankyou(string $toEmail, string $toName, float $amount, string $causeName): bool {
    $subject = 'Thank you for your donation — CareConnect';
    $body    = "
        <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;'>
            <h2 style='color:#1565C0;'>Thank you, {$toName}! 💚</h2>
            <p>Your donation of <strong>NPR " . number_format($amount, 2) . "</strong> to <strong>{$causeName}</strong> has been received.</p>
            <p>Your contribution is making a real difference in Nepal. Every rupee is tracked and goes directly to the cause you supported.</p>
            <p style='margin:28px 0;'>
                <a href='" . SITE_BASE_URL . "/donor_dashboard.html' style='background:#1565C0;color:#fff;padding:14px 28px;border-radius:30px;text-decoration:none;font-weight:700;'>View my donations →</a>
            </p>
            <p style='color:#999;font-size:12px;'>Thank you for being part of CareConnect.</p>
        </div>";
    return send_email($toEmail, $toName, $subject, $body);
}

function send_volunteer_thankyou(string $toEmail, string $toName, string $opportunity): bool {
    $subject = 'Volunteer application received — CareConnect';
    $body    = "
        <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;'>
            <h2 style='color:#1565C0;'>Thank you, {$toName}! 🙋</h2>
            <p>Your volunteer application for <strong>{$opportunity}</strong> has been received.</p>
            <p>The NGO will review your application and contact you soon. We appreciate your willingness to give your time and skills.</p>
            <p style='margin:28px 0;'>
                <a href='" . SITE_BASE_URL . "/volunteer_dashboard.html' style='background:#1565C0;color:#fff;padding:14px 28px;border-radius:30px;text-decoration:none;font-weight:700;'>View my applications →</a>
            </p>
            <p style='color:#999;font-size:12px;'>Thank you for being part of CareConnect.</p>
        </div>";
    return send_email($toEmail, $toName, $subject, $body);
}