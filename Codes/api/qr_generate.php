<?php
// api/qr_generate.php — creates a dummy "payment session" string to encode
// into a QR code. This is NOT a real payment gateway integration — it just
// produces a realistic-looking reference so the donation flow has a QR step,
// matching how eSewa/Khalti-style local payment UIs work.
header('Content-Type: application/json');
require_once 'db.php';

$data      = json_decode(file_get_contents('php://input'), true);
$user_id   = intval($data['user_id'] ?? 0);
$cause_id  = intval($data['cause_id'] ?? 0);
$amount    = floatval($data['amount'] ?? 0);

if (!$user_id || !$cause_id || $amount <= 0) {
    echo json_encode(["success" => false, "message" => "Missing donation details."]);
    exit;
}

$ref = 'CC-' . strtoupper(bin2hex(random_bytes(4))) . '-' . time();

// Payload that the QR code encodes — mimics a payment-app deep link
$payload = "careconnect://pay?ref={$ref}&amount={$amount}&currency=NPR&merchant=CareConnect";

echo json_encode([
    "success" => true,
    "reference" => $ref,
    "qr_payload" => $payload,
    "amount" => $amount
]);

$conn->close();
?>
