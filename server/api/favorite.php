<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// GET: list favorite book ids for a user
if ($method === 'GET') {
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    if ($user_id <= 0) {
        http_response_code(400);
        echo json_encode(["error" => "user_id is required"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT book_id FROM favorites WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $bookIds = array_map(fn($r) => (int)$r['book_id'], $rows);

    echo json_encode(["success" => true, "favorites" => $bookIds]);
    exit;
}

// POST: toggle favorite (add/remove)
if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    $user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $book_id = isset($input['book_id']) ? (int)$input['book_id'] : 0;

    if ($user_id <= 0 || $book_id <= 0) {
        http_response_code(400);
        echo json_encode(["error" => "user_id and book_id are required"]);
        exit;
    }

    // Check if already favorited
    $check = $conn->prepare("SELECT id FROM favorites WHERE user_id = ? AND book_id = ?");
    $check->execute([$user_id, $book_id]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // Remove favorite
        $del = $conn->prepare("DELETE FROM favorites WHERE id = ?");
        $del->execute([$existing['id']]);
        echo json_encode(["success" => true, "favorited" => false]);
    } else {
        // Add favorite
        $ins = $conn->prepare("INSERT INTO favorites (user_id, book_id) VALUES (?, ?)");
        $ins->execute([$user_id, $book_id]);
        echo json_encode(["success" => true, "favorited" => true]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);