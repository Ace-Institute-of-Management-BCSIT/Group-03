<?php

header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$user_id   = intval($data['user_id'] ?? 0);
$cause_id  = intval($data['cause_id'] ?? 0);
$amount    = floatval($data['amount'] ?? 0);
$frequency = $data['frequency'] ?? 'one_time';

$frequency = strtolower(str_replace(['-', ' '], '_', trim($frequency)));
$valid_freq = ['one_time', 'monthly', 'yearly'];
if (!in_array($frequency, $valid_freq)) {
    $frequency = 'one_time';
}

if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Please sign in to donate."]);
    exit;
}
if (!$cause_id || $amount <= 0) {
    echo json_encode(["success" => false, "message" => "Please choose a cause and a valid amount."]);
    exit;
}

// Confirm the cause actually exists before inserting
$check = $conn->prepare("SELECT id FROM cause WHERE id = ?");
$check->bind_param("i", $cause_id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Selected cause was not found."]);
    $check->close();
    $conn->close();
    exit;
}
$check->close();

$conn->begin_transaction();
try {
    $stmt = $conn->prepare("INSERT INTO donation (user_id, cause_id, amount, frequency, payment_status) VALUES (?, ?, ?, ?, 'completed')");
    $stmt->bind_param("iids", $user_id, $cause_id, $amount, $frequency);
    $stmt->execute();
    $stmt->close();

    $update = $conn->prepare("UPDATE cause SET raised_amount = raised_amount + ? WHERE id = ?");
    $update->bind_param("di", $amount, $cause_id);
    $update->execute();
    $update->close();

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Donation recorded successfully."]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success" => false, "message" => "Could not save donation. Please try again."]);
}

$conn->close();
?>