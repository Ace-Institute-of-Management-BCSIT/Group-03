<?php

mysqli_report(MYSQLI_REPORT_OFF);

$host   = "localhost";
$dbuser = "root";
$dbpass = "";            
$dbname = "careconnect_db";

$conn = new mysqli($host, $dbuser, $dbpass, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

$conn->set_charset("utf8mb4");
?>