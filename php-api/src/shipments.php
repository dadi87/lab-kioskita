<?php
// KiosKita - Legacy Shipping & Invoice Document Handler
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id, X-User-Role, X-Tenant-Id');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? 'list';
$currentUserId = $_SERVER['HTTP_X_USER_ID'] ?? null;
$currentUserRole = $_SERVER['HTTP_X_USER_ROLE'] ?? 'customer';
$currentTenantId = $_SERVER['HTTP_X_TENANT_ID'] ?? null;

switch ($action) {
    case 'list':
        handleListShipments($pdo, $currentUserId, $currentUserRole, $currentTenantId);
        break;

    case 'invoice':
        handleGetInvoice($pdo);
        break;

    case 'create':
        handleCreateShipment($pdo);
        break;

    default:
        sendError('Aksi shipment tidak valid', 404);
}

// 1. Daftar resi dan dokumen pengiriman
function handleListShipments($pdo, $userId, $role, $tenantId) {
    $query = "SELECT s.*, o.order_number, o.status as order_status, u.name as customer_name, t.name as tenant_name
              FROM shipments s
              JOIN orders o ON s.order_id = o.id
              JOIN users u ON o.customer_id = u.id
              JOIN tenants t ON o.tenant_id = t.id
              WHERE 1=1";
    $params = [];

    if ($role === 'customer') {
        $query .= " AND o.customer_id = ?";
        $params[] = $userId;
    } elseif ($role !== 'admin' && !empty($tenantId)) {
        $query .= " AND o.tenant_id = ?";
        $params[] = $tenantId;
    }

    $query .= " ORDER BY s.id DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $shipments = $stmt->fetchAll();

    sendJson([
        'success' => true,
        'data' => $shipments
    ]);
}

// 2. Akses Dokumen Invoice (IDOR Vulnerability)
// Celah IDOR: Invoice dapat diakses oleh user siapa saja hanya dengan mengganti order_id
function handleGetInvoice($pdo) {
    $orderId = $_GET['order_id'] ?? $_GET['id'] ?? null;
    if (!$orderId) {
        sendError('Parameter order_id wajib diisi', 400);
    }

    $stmt = $pdo->prepare("SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
                                  a.recipient_name, a.phone as shipping_phone, a.address_line, a.city, a.postal_code,
                                  t.name as tenant_name, t.code as tenant_code,
                                  s.tracking_number, s.courier, s.delivery_status, s.shipping_date
                           FROM orders o
                           JOIN users u ON o.customer_id = u.id
                           JOIN tenants t ON o.tenant_id = t.id
                           LEFT JOIN addresses a ON o.shipping_address_id = a.id
                           LEFT JOIN shipments s ON s.order_id = o.id
                           WHERE o.id = ?");
    $stmt->execute([$orderId]);
    $invoice = $stmt->fetch();

    if (!$invoice) {
        sendError('Invoice tidak ditemukan', 404);
    }

    $itemStmt = $pdo->prepare("SELECT oi.*, p.name as product_name, p.sku
                               FROM order_items oi
                               JOIN products p ON oi.product_id = p.id
                               WHERE oi.order_id = ?");
    $itemStmt->execute([$orderId]);
    $invoice['items'] = $itemStmt->fetchAll();

    sendJson([
        'success' => true,
        'data' => $invoice
    ]);
}

// 3. Buat entri pengiriman baru
function handleCreateShipment($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $orderId = $input['order_id'] ?? null;
    $courier = $input['courier'] ?? 'JNE Reguler';
    $labelFormat = $input['label_format'] ?? 'standard';
    $trackingNumber = 'TRK-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));

    if (!$orderId) {
        sendError('Parameter order_id wajib diisi', 400);
    }

    $stmt = $pdo->prepare("INSERT INTO shipments (order_id, tracking_number, courier, delivery_status, label_format, shipping_date)
                           VALUES (?, ?, ?, 'manifested', ?, NOW())");
    $stmt->execute([$orderId, $trackingNumber, $courier, $labelFormat]);

    $updateOrder = $pdo->prepare("UPDATE orders SET status = 'shipped' WHERE id = ?");
    $updateOrder->execute([$orderId]);

    sendJson([
        'success' => true,
        'message' => 'Resi pengiriman berhasil dibuat',
        'tracking_number' => $trackingNumber,
        'shipment_id' => $pdo->lastInsertId()
    ]);
}
