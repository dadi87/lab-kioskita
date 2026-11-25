<?php
// Helper untuk standardisasi output JSON legacy API

function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function sendError($message, $statusCode = 400) {
    sendJson([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

