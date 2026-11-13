<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";
require_once __DIR__ . "/review_helpers.php";

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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(["success" => false, "message" => "Method not allowed."], 405);
}

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
if ($user_id <= 0) {
    respond(["success" => false, "message" => "user_id is required."], 400);
}

$userStmt = $conn->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
$userStmt->execute([$user_id]);
if (!$userStmt->fetchColumn()) {
    respond(["success" => false, "message" => "User not found."], 404);
}

ensureReviewSchema($conn);

$booksStmt = $conn->prepare("
    SELECT b.id AS book_id, b.title AS book_title, b.image AS book_image,
           MAX(bb.returned_at) AS returned_at,
           r.id AS review_id, r.rating, r.comment, r.is_visible AS review_visible,
           r.updated_at AS reviewed_at
    FROM borrowed_books bb
    INNER JOIN books b ON b.id = bb.book_id
    LEFT JOIN book_reviews r ON r.user_id = bb.user_id AND r.book_id = bb.book_id
    WHERE bb.user_id = ? AND bb.status = 'returned' AND bb.returned_at IS NOT NULL
    GROUP BY b.id, b.title, b.image, r.id, r.rating, r.comment, r.is_visible, r.updated_at
    ORDER BY MAX(bb.returned_at) DESC
");
$booksStmt->execute([$user_id]);
$completedBooks = $booksStmt->fetchAll(PDO::FETCH_ASSOC);

respond([
    "success" => true,
    "books_read" => count($completedBooks),
    "completed_books" => $completedBooks
]);
