<?php
header('Content-Type: application/json');
require_once 'db.php';

$data         = json_decode(file_get_contents("php://input"), true);
$user_id      = intval($data['user_id']      ?? 0);
$opportunity  = trim($data['opportunity']    ?? '');
$cause_id     = isset($data['cause_id']) && $data['cause_id'] !== null ? intval($data['cause_id']) : null;
$availability = trim($data['availability']   ?? '');
$message      = trim($data['message']        ?? '');

if (!$user_id) { echo json_encode(["success"=>false,"message"=>"Please sign in first."]); exit; }
if (!$opportunity || !$availability) { echo json_encode(["success"=>false,"message"=>"Please fill in your availability before applying."]); exit; }

// Get user info for thank you email
$userStmt = $conn->prepare("SELECT full_name, email FROM users WHERE id = ?");
$userStmt->bind_param("i", $user_id);
$userStmt->execute();
$user = $userStmt->get_result()->fetch_assoc();
$userStmt->close();

// Find or create volunteer profile
$findVol = $conn->prepare("SELECT id FROM volunteer WHERE user_id = ?");
$findVol->bind_param("i", $user_id);
$findVol->execute();
$volRow = $findVol->get_result()->fetch_assoc();
$findVol->close();

if ($volRow) {
    $volunteer_id = intval($volRow['id']);
} else {
    $createVol = $conn->prepare("INSERT INTO volunteer (user_id) VALUES (?)");
    $createVol->bind_param("i", $user_id);
    $createVol->execute();
    $volunteer_id = $conn->insert_id;
    $createVol->close();
}

if (!$volunteer_id) { echo json_encode(["success"=>false,"message"=>"Could not set up your volunteer profile."]); exit; }

// Look up NGO from cause
$ngo_id = null;
if ($cause_id) {
    $lookup = $conn->prepare("SELECT ngo_id FROM cause WHERE id = ?");
    $lookup->bind_param("i", $cause_id);
    $lookup->execute();
    $row = $lookup->get_result()->fetch_assoc();
    $lookup->close();
    if ($row) $ngo_id = intval($row['ngo_id']);
}

$stmt = $conn->prepare("INSERT INTO volunteer_application (volunteer_id, ngo_id, cause_id, opportunity, availability, message, status) VALUES (?, ?, ?, ?, ?, ?, 'applied')");
if (!$stmt) { echo json_encode(["success"=>false,"message"=>"Server error: ".$conn->error]); exit; }
$stmt->bind_param("iiisss", $volunteer_id, $ngo_id, $cause_id, $opportunity, $availability, $message);

if ($stmt->execute()) {
    // Send thank you email
    if ($user) {
        require_once 'mailer.php';
        send_volunteer_thankyou($user['email'], $user['full_name'], $opportunity);
    }
    echo json_encode(["success"=>true,"message"=>"Application submitted! We'll contact you soon."]);
} else {
    echo json_encode(["success"=>false,"message"=>"Could not submit your application: ".$stmt->error]);
}

$stmt->close();
$conn->close();
?>