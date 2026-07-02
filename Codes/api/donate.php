<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$user_id        = intval($data['user_id']        ?? 0);
$cause_id       = intval($data['cause_id']       ?? 0);
$amount         = floatval($data['amount']       ?? 0);
$frequency      = $data['frequency']             ?? 'one_time';
$transaction_id = trim($data['transaction_id']   ?? '') ?: null;

$frequency = strtolower(str_replace(['-',' '], '_', trim($frequency)));
if (!in_array($frequency, ['one_time','monthly','yearly'])) $frequency = 'one_time';

if (!$user_id) { echo json_encode(["success"=>false,"message"=>"Please sign in to donate."]); exit; }
if (!$cause_id || $amount <= 0) { echo json_encode(["success"=>false,"message"=>"Please choose a cause and a valid amount."]); exit; }

// Confirm cause exists and get its title
$check = $conn->prepare("SELECT c.id, c.title, n.ngo_name FROM cause c LEFT JOIN ngo n ON n.id = c.ngo_id WHERE c.id = ?");
$check->bind_param("i", $cause_id);
$check->execute();
$cause = $check->get_result()->fetch_assoc();
$check->close();
if (!$cause) { echo json_encode(["success"=>false,"message"=>"Selected cause was not found."]); $conn->close(); exit; }

// Get donor info for thank you email
$userStmt = $conn->prepare("SELECT full_name, email FROM users WHERE id = ?");
$userStmt->bind_param("i", $user_id);
$userStmt->execute();
$user = $userStmt->get_result()->fetch_assoc();
$userStmt->close();

$conn->begin_transaction();
try {
    $stmt = $conn->prepare("INSERT INTO donation (user_id, cause_id, amount, frequency, payment_status, transaction_id) VALUES (?, ?, ?, ?, 'completed', ?)");
    $stmt->bind_param("iidss", $user_id, $cause_id, $amount, $frequency, $transaction_id);
    $stmt->execute();
    $stmt->close();

    $update = $conn->prepare("UPDATE cause SET raised_amount = raised_amount + ? WHERE id = ?");
    $update->bind_param("di", $amount, $cause_id);
    $update->execute();
    $update->close();

    $conn->commit();

    // Send thank you email
    if ($user) {
        require_once 'mailer.php';
        send_donation_thankyou($user['email'], $user['full_name'], $amount, $cause['title']);
    }

    echo json_encode(["success"=>true,"message"=>"Donation recorded successfully."]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success"=>false,"message"=>"Could not save donation. Please try again."]);
}

$conn->close();
?>