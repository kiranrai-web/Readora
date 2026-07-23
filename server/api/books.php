<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";

$stmt = $conn->query("
    SELECT *
    FROM books
    ORDER BY RAND()
");

$books = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($books);