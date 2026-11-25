<?php
// KiosKita - PHP Legacy API Router
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id, X-User-Role, X-Tenant-Id');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Simple path dispatching
if (str_starts_with($uri, '/orders')) {
    require __DIR__ . '/orders.php';
} elseif (str_starts_with($uri, '/shipments')) {
    require __DIR__ . '/shipments.php';
} elseif (str_starts_with($uri, '/label_generator') || str_starts_with($uri, '/labels')) {
    require __DIR__ . '/label_generator.php';
} elseif (str_starts_with($uri, '/coupons')) {
    require __DIR__ . '/coupons.php';
} else {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'online',
        'service' => 'KiosKita Legacy PHP API v1.2',
        'timestamp' => date('c')
    ]);
}

