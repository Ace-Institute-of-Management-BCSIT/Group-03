<?php
$conn = new mysqli("localhost", "root", "", "careconnect_db");

if ($conn->connect_error) {
    die("FAILED: " . $conn->connect_error);
}

echo "DB CONNECTED SUCCESSFULLY";
?>