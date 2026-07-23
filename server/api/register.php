<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";


$data = json_decode(file_get_contents("php://input"), true);// Read JSON sent from React

$name = trim($data["name"] ?? "");
$email = trim($data["email"] ?? "");
$password = trim($data["password"] ?? "");

if (empty($name) || empty($email) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit;
}

// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);

if ($stmt->fetch()) {
    echo json_encode([
        "success" => false,
        "message" => "Email already exists."
    ]);
    exit;
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert user
$stmt = $conn->prepare("
    INSERT INTO users(name, email, password)
    VALUES (?, ?, ?)
");

$stmt->execute([$name, $email, $hashedPassword]);

echo json_encode([
    "success" => true,
    "message" => "Registration successful!"
]);

?>