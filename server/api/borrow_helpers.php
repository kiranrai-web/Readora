<?php

function ensureBorrowSchema($conn)
{
    $stmt = $conn->query("
        SELECT COLUMN_NAME, DATA_TYPE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'borrowed_books'
    ");
    $columnRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $columns = [];
    foreach ($columnRows as $column) {
        $columns[$column['COLUMN_NAME']] = $column['DATA_TYPE'];
    }

    if (!isset($columns['loan_days'])) {
        $conn->exec("ALTER TABLE borrowed_books ADD COLUMN loan_days INT NOT NULL DEFAULT 7");
    }
    if (!isset($columns['pickup_at'])) {
        $conn->exec("ALTER TABLE borrowed_books ADD COLUMN pickup_at DATETIME NULL");
    }
    if (!isset($columns['pickup_expires_at'])) {
        $conn->exec("ALTER TABLE borrowed_books ADD COLUMN pickup_expires_at DATETIME NULL");
    }
    if (!isset($columns['status'])) {
        $conn->exec("ALTER TABLE borrowed_books ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'borrowed'");
    } elseif ($columns['status'] !== 'varchar') {
        $conn->exec("ALTER TABLE borrowed_books MODIFY status VARCHAR(32) NOT NULL DEFAULT 'borrowed'");
    }
}

function syncBookAvailability($conn)
{
    $conn->exec("
        UPDATE books b
        SET available = GREATEST(
            0,
            b.quantity - (
                SELECT COUNT(*)
                FROM borrowed_books bb
                WHERE bb.book_id = b.id AND bb.status IN ('reserved', 'borrowed')
            )
        )
    ");
}

function expirePickupReservations($conn)
{
    $conn->exec("
        UPDATE borrowed_books
        SET status = 'expired'
        WHERE status = 'reserved' AND pickup_expires_at <= NOW()
    ");
    syncBookAvailability($conn);
}
