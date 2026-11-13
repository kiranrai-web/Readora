<?php

function ensureReviewSchema($conn)
{
    $conn->exec("
        CREATE TABLE IF NOT EXISTS book_reviews (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            book_id INT NOT NULL,
            rating TINYINT NOT NULL,
            comment TEXT NULL,
            is_visible TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_book_review (user_id, book_id),
            KEY idx_book_reviews_book_visible (book_id, is_visible)
        )
    ");
}
