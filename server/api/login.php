<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";

// Read JSON from React/Postman
$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data["email"] ?? "");
$password = trim($data["password"] ?? "");

if (empty($email) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Email and password are required."
    ]);
    exit;
}

// Find user by email
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Check if user exists
if (!$user) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);
    exit;
}

// Verify password
if (!password_verify($password, $user["password"])) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);
    exit;
}


unset($user["password"]); // Don't return the password hash

echo json_encode([
    "success" => true,
    "message" => "Login successful!",
    "user" => $user
]);

?>