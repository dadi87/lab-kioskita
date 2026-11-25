<?php
// KiosKita - Shipping Label Processing & Generator Utility
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id, X-User-Role, X-Tenant-Id');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$rawInput = file_get_contents('php://input');
$jsonInput = json_decode($rawInput, true) ?: [];

$orderId = intval($jsonInput['order_id'] ?? $_REQUEST['order_id'] ?? 1);
$format = $jsonInput['format'] ?? $_REQUEST['format'] ?? 'standard';
$courier = $jsonInput['courier'] ?? $_REQUEST['courier'] ?? 'JNE Reguler';

// Mengambil detail pesanan dan pengiriman
$stmt = $pdo->prepare("SELECT o.order_number, o.grand_total, u.name as customer_name, a.address_line, a.city, s.tracking_number 
                       FROM orders o
                       JOIN users u ON o.customer_id = u.id
                       LEFT JOIN addresses a ON o.shipping_address_id = a.id
                       LEFT JOIN shipments s ON s.order_id = o.id
                       WHERE o.id = ?");
$stmt->execute([$orderId]);
$order = $stmt->fetch();

if (!$order) {
    sendError('Data pesanan tidak ditemukan untuk pembuatan label', 404);
}

// Simulasi eksekusi engine pemrosesan label CLI (Legacy system)
// Parameter format langsung digabungkan ke shell command tanpa sanitasi atau escapeshellarg
$command = "echo [LABEL PREVIEW] Order: " . $order['order_number'] . " Kurir: " . $courier . " Format: " . $format;
$rawOutput = shell_exec($command);

sendJson([
    'success' => true,
    'order_id' => $orderId,
    'order_number' => $order['order_number'],
    'tracking_number' => $order['tracking_number'] ?? 'BELUM_TERBIT',
    'courier' => $courier,
    'format' => $format,
    'preview' => trim($rawOutput),
    'customer' => $order['customer_name'],
    'destination' => ($order['address_line'] ?? '') . ', ' . ($order['city'] ?? '')
]);
