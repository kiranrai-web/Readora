<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";

const BORROW_LIMIT_HOURS = 7 * 24;

function getBorrowTimeLeftText($borrowedAt)
{
    if (empty($borrowedAt)) {
        return "0 minutes";
    }

    $now = new DateTime('now', new DateTimeZone('UTC'));
    $borrowedAtDate = new DateTime($borrowedAt, new DateTimeZone('UTC'));
    $dueAt = clone $borrowedAtDate;
    $dueAt->modify('+' . BORROW_LIMIT_HOURS . ' hours');

    $remainingSeconds = $dueAt->getTimestamp() - $now->getTimestamp();
    $remainingSeconds = max(0, $remainingSeconds);

    $days = intdiv($remainingSeconds, 86400);
    $hours = intdiv($remainingSeconds % 86400, 3600);
    $minutes = intdiv(($remainingSeconds % 3600), 60);

    $parts = [];
    if ($days > 0) {
        $parts[] = $days . "d";
    }
    if ($hours > 0) {
        $parts[] = $hours . "h";
    }
    if ($minutes > 0 || empty($parts)) {
        $parts[] = $minutes . "m";
    }

    return implode(' ', $parts) . " left to return";
}

function respond($payload, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method === 'GET') {
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    if (isset($_GET['admin']) && $_GET['admin'] === '1') {
        $stmt = $conn->query("
            SELECT bb.id, bb.user_id, bb.book_id, bb.borrowed_at,
                   u.name AS user_name, u.email,
                   b.title AS book_title, b.quantity, b.available
            FROM borrowed_books bb
            INNER JOIN users u ON u.id = bb.user_id
            INNER JOIN books b ON b.id = bb.book_id
            WHERE bb.status = 'borrowed'
            ORDER BY bb.borrowed_at DESC
        ");
        $loans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $usersStmt = $conn->query("
            SELECT u.id, u.name, u.email, u.created_at,
                   COUNT(bb.id) AS borrowed_count
            FROM users u
            LEFT JOIN borrowed_books bb
              ON bb.user_id = u.id AND bb.status = 'borrowed'
            GROUP BY u.id, u.name, u.email, u.created_at
            ORDER BY u.created_at DESC
        ");
        $users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);
        $inventoryStmt = $conn->query("
            SELECT
              COALESCE(SUM(quantity), 0) AS total_books,
              COALESCE(SUM(quantity - available), 0) AS borrowed_books
            FROM books
        ");
        $inventory = $inventoryStmt->fetch(PDO::FETCH_ASSOC);
        respond([
            "success" => true,
            "total_users" => count($users),
            "users" => $users,
            "loans" => $loans,
            "inventory" => [
                "total_books" => (int)$inventory['total_books'],
                "borrowed_books" => (int)$inventory['borrowed_books']
            ]
        ]);
    }

    if ($user_id <= 0) {
        respond(["error" => "user_id is required"], 400);
    }

    $stmt = $conn->prepare("
        SELECT book_id, borrowed_at, status
        FROM borrowed_books
        WHERE user_id = ? AND status = 'borrowed'
    ");
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $bookIds = array_map(fn($r) => (int)$r['book_id'], $rows);

    respond(["success" => true, "borrowed" => $bookIds, "borrowed_details" => $rows]);
}

if ($method === 'POST' || $method === 'PUT') {
    $input = json_decode(file_get_contents("php://input"), true);

    $user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $book_id = isset($input['book_id']) ? (int)$input['book_id'] : 0;
    $action = isset($input['action']) ? strtolower(trim($input['action'])) : 'borrow';

    if ($user_id <= 0 || $book_id <= 0) {
        respond(["error" => "user_id and book_id are required"], 400);
    }

    if ($action === 'return') {
        $existing = $conn->prepare("
            SELECT id, borrowed_at
            FROM borrowed_books
            WHERE user_id = ? AND book_id = ? AND status = 'borrowed'
            LIMIT 1
        ");
        $existing->execute([$user_id, $book_id]);
        $borrowRecord = $existing->fetch(PDO::FETCH_ASSOC);

        if (!$borrowRecord) {
            respond(["success" => false, "message" => "You do not currently have this book borrowed."], 400);
        }

        $update = $conn->prepare("
            UPDATE borrowed_books
            SET status = 'returned', returned_at = NOW()
            WHERE id = ?
        ");
        $update->execute([$borrowRecord['id']]);

        $bookStmt = $conn->prepare("SELECT quantity, available FROM books WHERE id = ? LIMIT 1");
        $bookStmt->execute([$book_id]);
        $book = $bookStmt->fetch(PDO::FETCH_ASSOC);

        $newAvailable = (int)($book['available'] ?? 0);
        if ($book) {
            $maxAvailable = max(0, (int)($book['quantity'] ?? 0));
            $newAvailable = min($maxAvailable, (int)($book['available'] ?? 0) + 1);
            $bookUpdate = $conn->prepare("UPDATE books SET available = ? WHERE id = ?");
            $bookUpdate->execute([$newAvailable, $book_id]);
        }

        respond([
            "success" => true,
            "returned" => true,
            "available" => $newAvailable,
            "message" => "Book returned successfully."
        ]);
    }

    $check = $conn->prepare("
        SELECT id, borrowed_at
        FROM borrowed_books
        WHERE user_id = ? AND book_id = ? AND status = 'borrowed'
        LIMIT 1
    ");
    $check->execute([$user_id, $book_id]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $remainingText = getBorrowTimeLeftText($existing['borrowed_at']);
        respond([
            "success" => true,
            "already_borrowed" => true,
            "message" => "You have already borrowed this book. Borrow time " . $remainingText . ".",
            "borrow_time_left" => $remainingText,
            "borrowed_at" => $existing['borrowed_at']
        ]);
    }

    $bookStmt = $conn->prepare("SELECT available, quantity FROM books WHERE id = ? LIMIT 1");
    $bookStmt->execute([$book_id]);
    $book = $bookStmt->fetch(PDO::FETCH_ASSOC);

    if (!$book) {
        respond(["success" => false, "message" => "Book not found."], 404);
    }

    $available = (int)($book['available'] ?? 0);
    $quantity = (int)($book['quantity'] ?? 0);

    if ($available <= 0 || $quantity <= 0) {
        respond([
            "success" => false,
            "already_borrowed" => false,
            "message" => "This book is currently unavailable."
        ], 409);
    }

    $ins = $conn->prepare("
        INSERT INTO borrowed_books (user_id, book_id, status, borrowed_at)
        VALUES (?, ?, 'borrowed', NOW())
    ");
    $ins->execute([$user_id, $book_id]);

    $updatedAvailable = max(0, $available - 1);
    $bookUpdate = $conn->prepare("UPDATE books SET available = ? WHERE id = ?");
    $bookUpdate->execute([$updatedAvailable, $book_id]);

    respond([
        "success" => true,
        "already_borrowed" => false,
        "available" => $updatedAvailable,
        "message" => "Book borrowed successfully."
    ]);
}

respond(["error" => "Method not allowed"], 405);