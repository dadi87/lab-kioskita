<?php
// KiosKita - Coupon & Promotion Service
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id, X-User-Role, X-Tenant-Id');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? 'verify';
$currentUserId = $_SERVER['HTTP_X_USER_ID'] ?? null;

switch ($action) {
    case 'verify':
    case 'apply':
        handleProcessCoupon($pdo, $currentUserId);
        break;

    case 'list':
        handleListCoupons($pdo);
        break;

    default:
        sendError('Aksi kupon tidak valid', 404);
}

// Business Logic Flaw:
// Validasi hanya memeriksa kupon aktif dan minimum pembelian,
// tetapi mengabaikan validasi riwayat penggunaan (coupon_usages / max_uses_per_user).
// Akibatnya kupon single-use seperti DISKON50K dapat dipakai berkali-kali oleh pengguna yang sama.
function handleProcessCoupon($pdo, $userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    $code = strtoupper(trim($input['code'] ?? ''));
    $subtotal = floatval($input['subtotal'] ?? 0);

    if (empty($code)) {
        sendError('Kode kupon wajib diisi', 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1");
    $stmt->execute([$code]);
    $coupon = $stmt->fetch();

    if (!$coupon) {
        sendError('Kupon tidak valid atau sudah kedaluwarsa', 404);
    }

    if ($subtotal < floatval($coupon['min_purchase'])) {
        $minFormatted = number_format($coupon['min_purchase'], 0, ',', '.');
        sendError("Minimum pembelian untuk kupon ini adalah Rp {$minFormatted}", 400);
    }

    // Perhitungan diskon
    $discount = 0;
    if ($coupon['discount_type'] === 'percentage') {
        $discount = ($subtotal * floatval($coupon['discount_value'])) / 100;
    } else {
        $discount = floatval($coupon['discount_value']);
    }

    if ($discount > $subtotal) {
        $discount = $subtotal;
    }

    sendJson([
        'success' => true,
        'message' => "Kupon {$code} berhasil diterapkan!",
        'coupon' => [
            'id' => $coupon['id'],
            'code' => $coupon['code'],
            'type' => $coupon['discount_type'],
            'value' => floatval($coupon['discount_value']),
            'discount_amount' => $discount,
            'final_subtotal' => max(0, $subtotal - $discount)
        ]
    ]);
}

function handleListCoupons($pdo) {
    $stmt = $pdo->query("SELECT id, code, discount_type, discount_value, min_purchase, is_active FROM coupons");
    $coupons = $stmt->fetchAll();

    sendJson([
        'success' => true,
        'data' => $coupons
    ]);
}

