<?php
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'];
$phone = $data['phone'];
$district = $data['district'];
$availability = $data['availability'];
$skills = $data['skills'];

$sql = "INSERT INTO volunteer (user_id, phone, district, availability, skills)
        VALUES (?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("issss", $user_id, $phone, $district, $availability, $skills);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false]);
}
?>v