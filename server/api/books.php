<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";
require_once __DIR__ . "/borrow_helpers.php";
require_once __DIR__ . "/review_helpers.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method === 'GET') {
    ensureBorrowSchema($conn);
    ensureReviewSchema($conn);
    expirePickupReservations($conn);

    $stmt = $conn->query("
        SELECT b.*,
               review_stats.average_rating AS rating,
               COALESCE(review_stats.review_count, 0) AS review_count
        FROM books b
        LEFT JOIN (
            SELECT book_id, ROUND(AVG(rating), 1) AS average_rating, COUNT(*) AS review_count
            FROM book_reviews
            WHERE is_visible = 1
            GROUP BY book_id
        ) review_stats ON review_stats.book_id = b.id
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

    $admin_id = isset($input['admin_id']) ? (int)$input['admin_id'] : 0;
    $adminStmt = $conn->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
    $adminStmt->execute([$admin_id]);
    if ($admin_id <= 0 || $adminStmt->fetchColumn() !== 'admin') {
        http_response_code(403);
        echo json_encode(["error" => "Admin access is required"]);
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

    if (empty($title) || empty($author) || $quantity < 0 || $available < 0 || $available > $quantity) {
        http_response_code(400);
        echo json_encode(["error" => "Title and author are required, and available copies must be between zero and total quantity"]);
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

if ($method === 'PUT') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON body"]);
        exit;
    }

    $admin_id = isset($input['admin_id']) ? (int)$input['admin_id'] : 0;
    $adminStmt = $conn->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
    $adminStmt->execute([$admin_id]);
    if ($admin_id <= 0 || $adminStmt->fetchColumn() !== 'admin') {
        http_response_code(403);
        echo json_encode(["error" => "Admin access is required"]);
        exit;
    }

    $book_id = isset($input['id']) ? (int)$input['id'] : 0;
    $title = trim((string)($input['title'] ?? ''));
    $author = trim((string)($input['author'] ?? ''));
    $category = trim((string)($input['category'] ?? ''));
    $image = trim((string)($input['image'] ?? ''));
    $summary = trim((string)($input['summary'] ?? ''));
    $quantity = filter_var($input['quantity'] ?? null, FILTER_VALIDATE_INT);
    $is_new = isset($input['is_new']) ? (int)$input['is_new'] : 0;

    if ($book_id <= 0 || $title === '' || $author === '' || $quantity === false || $quantity < 0 || !in_array($is_new, [0, 1], true)) {
        http_response_code(400);
        echo json_encode(["error" => "A valid book, title, author, non-negative quantity, and new status are required"]);
        exit;
    }

    try {
        $conn->beginTransaction();
        $bookStmt = $conn->prepare("SELECT id FROM books WHERE id = ? LIMIT 1 FOR UPDATE");
        $bookStmt->execute([$book_id]);
        if (!$bookStmt->fetchColumn()) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(["error" => "Book not found"]);
            exit;
        }

        $activeStmt = $conn->prepare("
            SELECT COUNT(*) FROM borrowed_books
            WHERE book_id = ? AND status IN ('reserved', 'borrowed')
        ");
        $activeStmt->execute([$book_id]);
        $activeCopies = (int)$activeStmt->fetchColumn();
        if ($quantity < $activeCopies) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode([
                "error" => "Total quantity cannot be lower than the number of books currently reserved or borrowed.",
                "active_copies" => $activeCopies
            ]);
            exit;
        }

        $available = $quantity - $activeCopies;
        $updateStmt = $conn->prepare("
            UPDATE books
            SET title = ?, author = ?, category = ?, image = ?, summary = ?,
                quantity = ?, available = ?, is_new = ?
            WHERE id = ?
        ");
        $updateStmt->execute([
            $title, $author, $category, $image, $summary,
            $quantity, $available, $is_new, $book_id
        ]);
        $conn->commit();
        echo json_encode([
            "success" => true,
            "message" => "Book updated successfully",
            "quantity" => $quantity,
            "available" => $available
        ]);
    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        http_response_code(500);
        echo json_encode(["error" => "Failed to update book"]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);