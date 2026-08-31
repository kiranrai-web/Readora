<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require "../config/db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method === 'GET') {
    $stmt = $conn->query("SELECT * FROM authors");
    $authors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($authors);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON body"]);
        exit;
    }

    $name = isset($input['name']) ? trim($input['name']) : '';
    $bio = isset($input['bio']) ? trim($input['bio']) : '';
    $nationality = isset($input['nationality']) ? trim($input['nationality']) : '';
    $birth_year = isset($input['birth_year']) ? trim($input['birth_year']) : '';
    $death_year = isset($input['death_year']) ? trim($input['death_year']) : '';

    if (empty($name)) {
        http_response_code(400);
        echo json_encode(["error" => "Name is required"]);
        exit;
    }

    try {
        $stmt = $conn->prepare("
            INSERT INTO authors (name, bio, nationality, birth_year, death_year)
            VALUES (:name, :bio, :nationality, :birth_year, :death_year)
        ");
        $stmt->execute([
            ':name' => $name,
            ':bio' => $bio,
            ':nationality' => $nationality,
            ':birth_year' => $birth_year,
            ':death_year' => $death_year,
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

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);