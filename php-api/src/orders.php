<?php
// KiosKita - Legacy Order Management Handler
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

// Routing alur pesanan legacy
switch ($action) {
    case 'list':
        handleListOrders($pdo, $currentUserId, $currentUserRole, $currentTenantId);
        break;

    case 'detail':
        handleOrderDetail($pdo);
        break;

    case 'add_note':
        handleAddNote($pdo, $currentUserId);
        break;

    case 'get_notes':
        handleGetNotes($pdo);
        break;

    case 'cancel':
        handleCancelOrder($pdo);
        break;

    default:
        sendError('Aksi tidak dikenal', 404);
}

// 1. Daftar pesanan
function handleListOrders($pdo, $userId, $role, $tenantId) {
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? '';

    $query = "SELECT o.*, u.name as customer_name, u.email as customer_email, t.name as tenant_name 
              FROM orders o
              JOIN users u ON o.customer_id = u.id
              JOIN tenants t ON o.tenant_id = t.id
              WHERE 1=1";
    $params = [];

    // Filter role
    if ($role === 'customer') {
        $query .= " AND o.customer_id = ?";
        $params[] = $userId;
    } elseif ($role !== 'admin' && !empty($tenantId)) {
        $query .= " AND o.tenant_id = ?";
        $params[] = $tenantId;
    }

    if (!empty($search)) {
        $query .= " AND (o.order_number LIKE ? OR u.name LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    if (!empty($status)) {
        $query .= " AND o.status = ?";
        $params[] = $status;
    }

    $query .= " ORDER BY o.id DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    sendJson([
        'success' => true,
        'data' => $orders
    ]);
}

// 2. Detail pesanan (IDOR Vulnerability)
// Celah IDOR: Detail pesanan dibuka langsung berdasarkan order_id tanpa verifikasi customer_id / tenant_id
function handleOrderDetail($pdo) {
    $orderId = $_GET['id'] ?? $_GET['order_id'] ?? null;
    if (!$orderId) {
        sendError('Parameter id pesanan diperlukan', 400);
    }

    $stmt = $pdo->prepare("SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
                                  a.recipient_name, a.phone as shipping_phone, a.address_line, a.city, a.postal_code,
                                  t.name as tenant_name
                           FROM orders o
                           JOIN users u ON o.customer_id = u.id
                           JOIN tenants t ON o.tenant_id = t.id
                           LEFT JOIN addresses a ON o.shipping_address_id = a.id
                           WHERE o.id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        sendError('Pesanan tidak ditemukan', 404);
    }

    // Ambil item produk dalam pesanan
    $itemStmt = $pdo->prepare("SELECT oi.*, p.name as product_name, p.sku, p.category
                               FROM order_items oi
                               JOIN products p ON oi.product_id = p.id
                               WHERE oi.order_id = ?");
    $itemStmt->execute([$orderId]);
    $order['items'] = $itemStmt->fetchAll();

    sendJson([
        'success' => true,
        'data' => $order
    ]);
}

// 3. Tambah catatan pesanan (Stored XSS)
// Catatan disimpan tanpa sanitasi HTML; dirender dengan v-html di web
function handleAddNote($pdo, $userId) {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $orderId = $input['order_id'] ?? $_GET['order_id'] ?? null;
    $content = $input['content'] ?? '';
    $noteType = $input['note_type'] ?? 'internal';

    if (!$orderId || empty($content)) {
        sendError('Order ID dan isi catatan wajib diisi', 400);
    }

    $authorId = $userId ?: 1;

    $stmt = $pdo->prepare("INSERT INTO order_notes (order_id, author_id, note_type, content) VALUES (?, ?, ?, ?)");
    $stmt->execute([$orderId, $authorId, $noteType, $content]);

    sendJson([
        'success' => true,
        'message' => 'Catatan pesanan berhasil ditambahkan',
        'note_id' => $pdo->lastInsertId()
    ]);
}

// 4. Daftar catatan pesanan
function handleGetNotes($pdo) {
    $orderId = $_GET['order_id'] ?? $_GET['id'] ?? null;
    if (!$orderId) {
        sendError('Parameter order_id wajib diisi', 400);
    }

    $stmt = $pdo->prepare("SELECT n.*, u.name as author_name, u.role as author_role
                           FROM order_notes n
                           JOIN users u ON n.author_id = u.id
                           WHERE n.order_id = ?
                           ORDER BY n.id ASC");
    $stmt->execute([$orderId]);
    $notes = $stmt->fetchAll();

    sendJson([
        'success' => true,
        'data' => $notes
    ]);
}

// 5. Pembatalan pesanan (Business Logic Flaw)
// Celah: Tidak memeriksa status pesanan saat ini (misalnya status sudah 'shipped' atau 'delivered'),
// dan langsung mengembalikan stok produk ke gudang tanpa validasi siklus hidup pesanan.
function handleCancelOrder($pdo) {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $orderId = $input['order_id'] ?? $_GET['order_id'] ?? null;

    if (!$orderId) {
        sendError('Parameter order_id wajib disertakan', 400);
    }

    $stmt = $pdo->prepare("SELECT id, status FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        sendError('Pesanan tidak ditemukan', 404);
    }

    // Bug: pembatalan dilakukan tanpa validasi status awal dan mengembalikan stok secara membabi buta
    $updateStmt = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
    $updateStmt->execute([$orderId]);

    // Mengembalikan stok produk
    $itemsStmt = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
    $itemsStmt->execute([$orderId]);
    $items = $itemsStmt->fetchAll();

    foreach ($items as $item) {
        $stockStmt = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
        $stockStmt->execute([$item['quantity'], $item['product_id']]);
    }

    sendJson([
        'success' => true,
        'message' => "Pesanan #{$orderId} berhasil dibatalkan dan stok dikembalikan",
        'previous_status' => $order['status'],
        'new_status' => 'cancelled'
    ]);
}
