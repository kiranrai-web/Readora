<?php

function ensureAccountSchema($conn)
{
    $stmt = $conn->query("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'must_change_password'
    ");

    if ((int)$stmt->fetchColumn() === 0) {
        $conn->exec("
            ALTER TABLE users
            ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0
        ");
    }
}
