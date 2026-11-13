<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";
require_once __DIR__ . "/account_helpers.php";

function respond($payload, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(["success" => false, "message" => "Method not allowed."], 405);
}

ensureAccountSchema($conn);

$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$current_password = isset($input['current_password']) ? (string)$input['current_password'] : '';
$new_password = isset($input['new_password']) ? (string)$input['new_password'] : '';

if ($user_id <= 0 || $current_password === '' || $new_password === '') {
    respond(["success" => false, "message" => "All password fields are required."], 400);
}

if (strlen($new_password) < 8) {
    respond(["success" => false, "message" => "New password must be at least 8 characters."], 400);
}

if ($current_password === $new_password) {
    respond(["success" => false, "message" => "Choose a new password different from your current password."], 400);
}

$stmt = $conn->prepare("SELECT password FROM users WHERE id = ? LIMIT 1");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($current_password, $user['password'])) {
    respond(["success" => false, "message" => "Current password is incorrect."], 403);
}

$passwordHash = password_hash($new_password, PASSWORD_DEFAULT);
$update = $conn->prepare("UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?");
$update->execute([$passwordHash, $user_id]);

respond([
    "success" => true,
    "message" => "Your password has been changed."
]);
