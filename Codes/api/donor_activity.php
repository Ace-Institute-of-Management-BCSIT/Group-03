<?php
// api/donor_activity.php — GET ?user_id=X — donor's cash + item donation history
header('Content-Type: application/json');
require_once 'db.php';

$user_id = intval($_GET['user_id'] ?? 0);
if (!$user_id) {
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit;
}

$cash = $conn->prepare("
    SELECT d.id, c.title AS cause_title, d.amount, d.frequency, d.payment_status, d.transaction_id, d.donated_at
    FROM donation d JOIN cause c ON c.id = d.cause_id
    WHERE d.user_id = ?
    ORDER BY d.donated_at DESC
");
$cash->bind_param("i", $user_id);
$cash->execute();
$cashRows = [];
$totalCash = 0;
$res = $cash->get_result();
while ($r = $res->fetch_assoc()) {
    $r['amount'] = floatval($r['amount']);
    $totalCash += $r['amount'];
    $cashRows[] = $r;
}
$cash->close();

$items = $conn->prepare("
    SELECT i.id, c.title AS cause_title, i.items_description, i.meetup_location, i.meetup_time, i.status, i.created_at
    FROM item_donation i JOIN cause c ON c.id = i.cause_id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
");
$items->bind_param("i", $user_id);
$items->execute();
$itemRows = [];
$res2 = $items->get_result();
while ($r = $res2->fetch_assoc()) { $itemRows[] = $r; }
$items->close();

echo json_encode([
    "success" => true,
    "cash_donations" => $cashRows,
    "item_donations" => $itemRows,
    "total_donated" => $totalCash,
    "causes_supported" => count(array_unique(array_column($cashRows, 'cause_title')))
]);

$conn->close();
?>
