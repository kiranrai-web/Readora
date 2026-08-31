<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method === 'POST') {
    if (!isset($_FILES['image'])) {
        http_response_code(400);
        echo json_encode(["error" => "No image file uploaded"]);
        exit;
    }

    $file = $_FILES['image'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["error" => "Upload failed with error code: " . $file['error']]);
        exit;
    }

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(["error" => "Only JPG, PNG, GIF, and WEBP images are allowed"]);
        exit;
    }

    // Generate a unique filename
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $ext = strtolower($ext ?: 'jpg');
    $filename = uniqid('book_') . '.' . $ext;

    $targetDir = __DIR__ . '/../images/';
    $targetPath = $targetDir . $filename;

    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {

        echo json_encode([
            "success" => true,
            "image" => "images/" . $filename,
            "filename" => $filename,
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save the uploaded file"]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);