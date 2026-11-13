<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";
require_once __DIR__ . "/borrow_helpers.php";
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

ensureBorrowSchema($conn);
ensureAccountSchema($conn);

$input = json_decode(file_get_contents("php://input"), true);
$admin_id = isset($input['admin_id']) ? (int)$input['admin_id'] : 0;
$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$admin_password = isset($input['admin_password']) ? (string)$input['admin_password'] : '';
$action = isset($input['action']) ? trim($input['action']) : '';

if ($admin_id <= 0 || $user_id <= 0 || $admin_password === '') {
    respond(["success" => false, "message" => "Admin credentials and user id are required."], 400);
}

$adminStmt = $conn->prepare("SELECT role, password FROM users WHERE id = ? LIMIT 1");
$adminStmt->execute([$admin_id]);
$admin = $adminStmt->fetch(PDO::FETCH_ASSOC);

if (!$admin || $admin['role'] !== 'admin' || !password_verify($admin_password, $admin['password'])) {
    respond(["success" => false, "message" => "Admin password is incorrect."], 403);
}

$targetStmt = $conn->prepare("SELECT id, name, role FROM users WHERE id = ? LIMIT 1");
$targetStmt->execute([$user_id]);
$target = $targetStmt->fetch(PDO::FETCH_ASSOC);

if (!$target) {
    respond(["success" => false, "message" => "User not found."], 404);
}

if ($target['role'] === 'admin') {
    respond(["success" => false, "message" => "Admin accounts cannot be changed here."], 403);
}

if ($action === 'reset_password') {
    $new_password = isset($input['new_password']) ? (string)$input['new_password'] : '';
    if (strlen($new_password) < 8) {
        respond(["success" => false, "message" => "Temporary password must be at least 8 characters."], 400);
    }

    $passwordHash = password_hash($new_password, PASSWORD_DEFAULT);
    $update = $conn->prepare("UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?");
    $update->execute([$passwordHash, $user_id]);

    respond([
        "success" => true,
        "message" => "Temporary password set for " . $target['name'] . "."
    ]);
}

if ($action === 'delete_user') {
    expirePickupReservations($conn);

    $activeLoans = $conn->prepare("
        SELECT COUNT(*)
        FROM borrowed_books
        WHERE user_id = ? AND status IN ('reserved', 'borrowed')
    ");
    $activeLoans->execute([$user_id]);
    if ((int)$activeLoans->fetchColumn() > 0) {
        respond([
            "success" => false,
            "message" => "This user has active reservations or loans. They must be returned or expire before the account can be removed."
        ], 409);
    }

    try {
        $conn->beginTransaction();
        $deleteFavorites = $conn->prepare("DELETE FROM favorites WHERE user_id = ?");
        $deleteFavorites->execute([$user_id]);
        $reviewTable = $conn->prepare("
            SELECT COUNT(*)
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'book_reviews'
        ");
        $reviewTable->execute();
        if ((int)$reviewTable->fetchColumn() > 0) {
            $deleteReviews = $conn->prepare("DELETE FROM book_reviews WHERE user_id = ?");
            $deleteReviews->execute([$user_id]);
        }
        $deleteHistory = $conn->prepare("DELETE FROM borrowed_books WHERE user_id = ?");
        $deleteHistory->execute([$user_id]);
        $deleteUser = $conn->prepare("DELETE FROM users WHERE id = ? AND role <> 'admin'");
        $deleteUser->execute([$user_id]);

        if ($deleteUser->rowCount() !== 1) {
            $conn->rollBack();
            respond(["success" => false, "message" => "User could not be removed."], 409);
        }

        $conn->commit();
    } catch (Throwable $error) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        error_log("Admin user deletion failed: " . $error->getMessage());
        respond(["success" => false, "message" => "User could not be removed. Please try again."], 500);
    }

    respond([
        "success" => true,
        "message" => $target['name'] . " was removed."
    ]);
}

respond(["success" => false, "message" => "Unknown user management action."], 400);
