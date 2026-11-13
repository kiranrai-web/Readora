<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

ensureReviewSchema($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $book_id = isset($_GET['book_id']) ? (int)$_GET['book_id'] : 0;
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    if (isset($_GET['pending_returns']) && $_GET['pending_returns'] === '1') {
        if ($user_id <= 0) {
            respond(["success" => false, "message" => "user_id is required."], 400);
        }

        $stmt = $conn->prepare("
            SELECT bb.book_id, b.title AS book_title, MAX(bb.returned_at) AS returned_at
            FROM borrowed_books bb
            INNER JOIN books b ON b.id = bb.book_id
            LEFT JOIN book_reviews r ON r.user_id = bb.user_id AND r.book_id = bb.book_id
            WHERE bb.user_id = ? AND bb.status = 'returned'
              AND bb.returned_at IS NOT NULL AND r.id IS NULL
            GROUP BY bb.book_id, b.title
            ORDER BY MAX(bb.returned_at) DESC
        ");
        $stmt->execute([$user_id]);
        respond(["success" => true, "books" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if (isset($_GET['admin']) && $_GET['admin'] === '1') {
        $admin_id = isset($_GET['admin_id']) ? (int)$_GET['admin_id'] : 0;
        $adminStmt = $conn->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
        $adminStmt->execute([$admin_id]);
        if ($admin_id <= 0 || $adminStmt->fetchColumn() !== 'admin') {
            respond(["success" => false, "message" => "Admin access is required."], 403);
        }

        $stmt = $conn->query("
            SELECT r.id, r.user_id, r.book_id, r.rating, r.comment, r.is_visible,
                   r.created_at, r.updated_at, u.name AS user_name, b.title AS book_title
            FROM book_reviews r
            INNER JOIN users u ON u.id = r.user_id
            INNER JOIN books b ON b.id = r.book_id
            ORDER BY r.created_at DESC
        ");
        respond(["success" => true, "reviews" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($book_id <= 0) {
        respond(["success" => false, "message" => "book_id is required."], 400);
    }

    $stmt = $conn->prepare("
        SELECT r.id, r.book_id, r.rating, r.comment, r.created_at, r.updated_at,
               u.name AS user_name
        FROM book_reviews r
        INNER JOIN users u ON u.id = r.user_id
        WHERE r.book_id = ? AND r.is_visible = 1
        ORDER BY r.created_at DESC
    ");
    $stmt->execute([$book_id]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $eligibility = false;
    $myReview = null;
    if ($user_id > 0) {
        $eligibleStmt = $conn->prepare("
            SELECT EXISTS(
                SELECT 1 FROM borrowed_books
                WHERE user_id = ? AND book_id = ? AND status = 'returned'
            )
        ");
        $eligibleStmt->execute([$user_id, $book_id]);
        $eligibility = (bool)$eligibleStmt->fetchColumn();

        $myReviewStmt = $conn->prepare("
            SELECT id, user_id, book_id, rating, comment, is_visible, created_at, updated_at
            FROM book_reviews
            WHERE user_id = ? AND book_id = ?
            LIMIT 1
        ");
        $myReviewStmt->execute([$user_id, $book_id]);
        $myReview = $myReviewStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    $totalReviews = count($reviews);
    $averageRating = $totalReviews > 0
        ? round(array_sum(array_map(fn($review) => (int)$review['rating'], $reviews)) / $totalReviews, 1)
        : null;

    respond([
        "success" => true,
        "reviews" => $reviews,
        "eligible" => $eligibility,
        "my_review" => $myReview,
        "total_reviews" => $totalReviews,
        "average_rating" => $averageRating
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(["success" => false, "message" => "Method not allowed."], 405);
}

$input = json_decode(file_get_contents("php://input"), true);
$action = trim($input['action'] ?? 'save');

if ($action === 'moderate') {
    $admin_id = isset($input['admin_id']) ? (int)$input['admin_id'] : 0;
    $review_id = isset($input['review_id']) ? (int)$input['review_id'] : 0;
    $admin_password = (string)($input['admin_password'] ?? '');
    $is_visible = isset($input['is_visible']) ? (int)$input['is_visible'] : -1;

    if ($admin_id <= 0 || $review_id <= 0 || $admin_password === '' || !in_array($is_visible, [0, 1], true)) {
        respond(["success" => false, "message" => "Admin credentials and review status are required."], 400);
    }

    $adminStmt = $conn->prepare("SELECT role, password FROM users WHERE id = ? LIMIT 1");
    $adminStmt->execute([$admin_id]);
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);
    if (!$admin || $admin['role'] !== 'admin' || !password_verify($admin_password, $admin['password'])) {
        respond(["success" => false, "message" => "Admin password is incorrect."], 403);
    }

    $update = $conn->prepare("UPDATE book_reviews SET is_visible = ? WHERE id = ?");
    $update->execute([$is_visible, $review_id]);
    if ($update->rowCount() === 0) {
        $exists = $conn->prepare("SELECT id FROM book_reviews WHERE id = ? LIMIT 1");
        $exists->execute([$review_id]);
        if (!$exists->fetchColumn()) {
            respond(["success" => false, "message" => "Review not found."], 404);
        }
    }

    respond([
        "success" => true,
        "message" => $is_visible ? "Review restored." : "Review hidden."
    ]);
}

$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$book_id = isset($input['book_id']) ? (int)$input['book_id'] : 0;
$rating = isset($input['rating']) ? (int)$input['rating'] : 0;
$comment = trim((string)($input['comment'] ?? ''));

if ($user_id <= 0 || $book_id <= 0 || $rating < 1 || $rating > 5) {
    respond(["success" => false, "message" => "A valid user, book, and 1–5 star rating are required."], 400);
}
if (strlen($comment) > 8000) {
    respond(["success" => false, "message" => "Review comments must be 2,000 characters or fewer."], 400);
}

$eligibleStmt = $conn->prepare("
    SELECT EXISTS(
        SELECT 1 FROM borrowed_books
        WHERE user_id = ? AND book_id = ? AND status = 'returned'
    )
");
$eligibleStmt->execute([$user_id, $book_id]);
if (!(bool)$eligibleStmt->fetchColumn()) {
    respond(["success" => false, "message" => "You can review this book after it has been returned."], 403);
}

$save = $conn->prepare("
    INSERT INTO book_reviews (user_id, book_id, rating, comment, is_visible)
    VALUES (?, ?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        comment = VALUES(comment),
        is_visible = 1,
        updated_at = CURRENT_TIMESTAMP
");
$save->execute([$user_id, $book_id, $rating, $comment === '' ? null : $comment]);

respond(["success" => true, "message" => "Your review has been saved."]);
