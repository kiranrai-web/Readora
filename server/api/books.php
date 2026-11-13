<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";
require_once __DIR__ . "/borrow_helpers.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method === 'GET') {
    ensureBorrowSchema($conn);
    expirePickupReservations($conn);

    $stmt = $conn->query("
        SELECT *
        FROM books
        ORDER BY RAND()
    ");
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($books);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON body"]);
        exit;
    }

    $title = isset($input['title']) ? trim($input['title']) : '';
    $author = isset($input['author']) ? trim($input['author']) : '';
    $category = isset($input['category']) ? trim($input['category']) : '';
    $image = isset($input['image']) ? trim($input['image']) : '';
    $summary = isset($input['summary']) ? trim($input['summary']) : '';
    $quantity = isset($input['quantity']) ? (int)$input['quantity'] : 0;
    $available = isset($input['available']) ? (int)$input['available'] : 0;
    $is_new = isset($input['is_new']) ? (int)$input['is_new'] : 0;

    if (empty($title) || empty($author)) {
        http_response_code(400);
        echo json_encode(["error" => "Title and author are required"]);
        exit;
    }

    try {
        $stmt = $conn->prepare("
            INSERT INTO books (title, author, category, image, summary, quantity, available, is_new)
            VALUES (:title, :author, :category, :image, :summary, :quantity, :available, :is_new)
        ");
        $stmt->execute([
            ':title' => $title,
            ':author' => $author,
            ':category' => $category,
            ':image' => $image,
            ':summary' => $summary,
            ':quantity' => $quantity,
            ':available' => $available,
            ':is_new' => $is_new,
        ]);

        $id = $conn->lastInsertId();
        http_response_code(201);
        echo json_encode(["success" => true, "id" => $id]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);