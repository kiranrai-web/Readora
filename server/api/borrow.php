<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";
require_once __DIR__ . "/borrow_helpers.php";

const PICKUP_WINDOW_HOURS = 24;

function getBorrowTimeLeftText($borrowedAt, $loanDays)
{
    if (empty($borrowedAt)) {
        return "0 minutes";
    }

    $now = new DateTime('now', new DateTimeZone('UTC'));
    $borrowedAtDate = new DateTime($borrowedAt, new DateTimeZone('UTC'));
    $dueAt = clone $borrowedAtDate;
    $dueAt->modify('+' . (int)$loanDays . ' days');

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

ensureBorrowSchema($conn);

if ($method === 'GET') {
    expirePickupReservations($conn);

    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    if (isset($_GET['admin']) && $_GET['admin'] === '1') {
        $stmt = $conn->query("
            SELECT bb.id, bb.user_id, bb.book_id, bb.status, bb.borrowed_at,
                   bb.pickup_at, bb.pickup_expires_at, bb.loan_days,
                   UNIX_TIMESTAMP(
                       DATE_ADD(COALESCE(bb.pickup_at, bb.borrowed_at), INTERVAL bb.loan_days DAY)
                   ) AS return_due_at_epoch,
                   u.name AS user_name, u.email,
                   b.title AS book_title, b.quantity, b.available
            FROM borrowed_books bb
            INNER JOIN users u ON u.id = bb.user_id
            INNER JOIN books b ON b.id = bb.book_id
            WHERE bb.status IN ('reserved', 'borrowed')
            ORDER BY bb.borrowed_at DESC
        ");
        $loans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $usersStmt = $conn->query("
            SELECT u.id, u.name, u.email, u.created_at,
                   COUNT(bb.id) AS borrowed_count
            FROM users u
            LEFT JOIN borrowed_books bb
              ON bb.user_id = u.id AND bb.status IN ('reserved', 'borrowed')
            GROUP BY u.id, u.name, u.email, u.created_at
            ORDER BY u.created_at DESC
        ");
        $users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);
        $inventoryStmt = $conn->query("
            SELECT
              COALESCE(SUM(quantity), 0) AS total_books,
              (SELECT COUNT(*) FROM borrowed_books WHERE status = 'borrowed') AS borrowed_books,
              (SELECT COUNT(*) FROM borrowed_books WHERE status = 'reserved') AS reserved_books
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
                "borrowed_books" => (int)$inventory['borrowed_books'],
                "reserved_books" => (int)$inventory['reserved_books']
            ]
        ]);
    }

    if ($user_id <= 0) {
        respond(["error" => "user_id is required"], 400);
    }

    $stmt = $conn->prepare("
        SELECT book_id, borrowed_at, pickup_at, pickup_expires_at, loan_days, status,
               UNIX_TIMESTAMP(pickup_expires_at) AS pickup_expires_at_epoch,
               UNIX_TIMESTAMP(
                   DATE_ADD(COALESCE(pickup_at, borrowed_at), INTERVAL loan_days DAY)
               ) AS return_due_at_epoch
        FROM borrowed_books
        WHERE user_id = ? AND status IN ('reserved', 'borrowed')
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

    expirePickupReservations($conn);

    if ($action === 'pickup') {
        $admin_id = isset($input['admin_id']) ? (int)$input['admin_id'] : 0;
        $admin_password = isset($input['admin_password']) ? (string)$input['admin_password'] : '';
        $adminStmt = $conn->prepare("SELECT role, password FROM users WHERE id = ? LIMIT 1");
        $adminStmt->execute([$admin_id]);
        $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);
        if (
            $admin_id <= 0 ||
            !$admin ||
            $admin['role'] !== 'admin' ||
            !password_verify($admin_password, $admin['password'])
        ) {
            respond(["success" => false, "message" => "Admin password is incorrect."], 403);
        }

        $pickup = $conn->prepare("
            UPDATE borrowed_books
            SET status = 'borrowed', pickup_at = NOW(), borrowed_at = NOW(),
                pickup_expires_at = NULL
            WHERE user_id = ? AND book_id = ? AND status = 'reserved'
        ");
        $pickup->execute([$user_id, $book_id]);

        if ($pickup->rowCount() === 0) {
            respond(["success" => false, "message" => "This reservation is no longer waiting for pickup."], 409);
        }

        $loanStmt = $conn->prepare("
            SELECT loan_days, pickup_at
            FROM borrowed_books
            WHERE user_id = ? AND book_id = ? AND status = 'borrowed'
            ORDER BY pickup_at DESC
            LIMIT 1
        ");
        $loanStmt->execute([$user_id, $book_id]);
        $loan = $loanStmt->fetch(PDO::FETCH_ASSOC);

        respond([
            "success" => true,
            "picked_up" => true,
            "loan_days" => (int)$loan['loan_days'],
            "pickup_at" => $loan['pickup_at'],
            "message" => "Book marked as picked up. The return period has started."
        ]);
    }

    if ($action === 'return' || $action === 'admin_return') {
        if ($action === 'admin_return') {
            $admin_id = isset($input['admin_id']) ? (int)$input['admin_id'] : 0;
            $admin_password = isset($input['admin_password']) ? (string)$input['admin_password'] : '';
            $adminStmt = $conn->prepare("SELECT role, password FROM users WHERE id = ? LIMIT 1");
            $adminStmt->execute([$admin_id]);
            $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);
            if (
                $admin_id <= 0 ||
                !$admin ||
                $admin['role'] !== 'admin' ||
                !password_verify($admin_password, $admin['password'])
            ) {
                respond(["success" => false, "message" => "Admin password is incorrect."], 403);
            }
        }

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

    $loanDays = isset($input['loan_days']) ? (int)$input['loan_days'] : 7;
    if ($loanDays < 3 || $loanDays > 30) {
        respond(["success" => false, "message" => "Borrow duration must be between 3 and 30 days."], 400);
    }

    $conn->beginTransaction();
    $userStmt = $conn->prepare("SELECT id FROM users WHERE id = ? LIMIT 1 FOR UPDATE");
    $userStmt->execute([$user_id]);
    if (!$userStmt->fetchColumn()) {
        $conn->rollBack();
        respond(["success" => false, "message" => "User not found."], 404);
    }

    $bookStmt = $conn->prepare("SELECT available, quantity FROM books WHERE id = ? LIMIT 1 FOR UPDATE");
    $bookStmt->execute([$book_id]);
    $book = $bookStmt->fetch(PDO::FETCH_ASSOC);

    if (!$book) {
        $conn->rollBack();
        respond(["success" => false, "message" => "Book not found."], 404);
    }

    $check = $conn->prepare("
        SELECT id, borrowed_at, status, loan_days
        FROM borrowed_books
        WHERE user_id = ? AND book_id = ? AND status IN ('reserved', 'borrowed')
        LIMIT 1
        FOR UPDATE
    ");
    $check->execute([$user_id, $book_id]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $conn->rollBack();
        $remainingText = $existing['status'] === 'reserved'
            ? "waiting for pickup"
            : getBorrowTimeLeftText($existing['pickup_at'] ?: $existing['borrowed_at'], $existing['loan_days']);
        respond([
            "success" => true,
            "already_borrowed" => true,
            "message" => "You already have this book reserved or borrowed (" . $remainingText . ").",
            "borrow_time_left" => $remainingText,
            "borrowed_at" => $existing['borrowed_at']
        ]);
    }

    $activeCountStmt = $conn->prepare("
        SELECT COUNT(*)
        FROM borrowed_books
        WHERE user_id = ? AND status IN ('reserved', 'borrowed')
    ");
    $activeCountStmt->execute([$user_id]);
    $activeBorrowCount = (int)$activeCountStmt->fetchColumn();
    if ($activeBorrowCount >= 3) {
        $conn->rollBack();
        respond([
            "success" => false,
            "limit_reached" => true,
            "active_borrow_count" => $activeBorrowCount,
            "max_active_borrows" => 3,
            "message" => "You can have up to 3 active books at a time. Return a book to the library before borrowing another."
        ], 409);
    }

    $available = (int)($book['available'] ?? 0);
    $quantity = (int)($book['quantity'] ?? 0);

    if ($available <= 0 || $quantity <= 0) {
        $conn->rollBack();
        respond([
            "success" => false,
            "already_borrowed" => false,
            "message" => "This book is currently unavailable."
        ], 409);
    }

    $ins = $conn->prepare("
        INSERT INTO borrowed_books
            (user_id, book_id, status, borrowed_at, pickup_expires_at, loan_days)
        VALUES (?, ?, 'reserved', NOW(), DATE_ADD(NOW(), INTERVAL " . PICKUP_WINDOW_HOURS . " HOUR), ?)
    ");
    $ins->execute([$user_id, $book_id, $loanDays]);

    $updatedAvailable = max(0, $available - 1);
    $bookUpdate = $conn->prepare("UPDATE books SET available = ? WHERE id = ?");
    $bookUpdate->execute([$updatedAvailable, $book_id]);
    $conn->commit();

    respond([
        "success" => true,
        "already_borrowed" => false,
        "status" => "reserved",
        "pickup_expires_at" => date('Y-m-d H:i:s', time() + PICKUP_WINDOW_HOURS * 3600),
        "loan_days" => $loanDays,
        "available" => $updatedAvailable,
        "message" => "Book reserved successfully. Pick it up within 24 hours."
    ]);
}

respond(["error" => "Method not allowed"], 405);