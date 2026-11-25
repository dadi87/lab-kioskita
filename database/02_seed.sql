-- KiosKita Database Seed Data
-- Local Security Training Lab - Data Dummy

-- 1. Tenants
INSERT INTO tenants (id, name, code) VALUES
(1, 'CV Sumber Rejeki', 'TEN-001'),
(2, 'UD Berkah Jaya', 'TEN-002');

-- 2. Users (Password: password123)
-- Hash: $2y$12$bz350OlJuLRL/eGWYtjcPuej9dtTupKuMMxQxxz2lbaJ6kcdl3nm6
INSERT INTO users (id, tenant_id, name, email, password, role, phone) VALUES
(1, 1, 'Administrator Pusat', 'admin@kioskita.local', '$2y$12$bz350OlJuLRL/eGWYtjcPuej9dtTupKuMMxQxxz2lbaJ6kcdl3nm6', 'admin', '0811000001'),
(2, 1, 'Hendra Kurniawan (Manager)', 'manager@kioskita.local', '$2y$12$bz350OlJuLRL/eGWYtjcPuej9dtTupKuMMxQxxz2lbaJ6kcdl3nm6', 'manager', '0812000002'),
(3, 1, 'Agus Santoso (Staff Gudang 1)', 'staff1@kioskita.local', '$2y$12$bz350OlJuLRL/eGWYtjcPuej9dtTupKuMMxQxxz2lbaJ6kcdl3nm6', 'staff', '0813000003'),
(4, 2, 'Rina Marlina (Staff Logistik 2)', 'staff2@kioskita.local', '$2y$12$bz350OlJuLRL/eGWYtjcPuej9dtTupKuMMxQxxz2lbaJ6kcdl3nm6', 'staff', '0814000004'),
(5, 1, 'Budi Santoso', 'budi@customer.local', '$2y$12$bz350OlJuLRL/eGWYtjcPuej9dtTupKuMMxQxxz2lbaJ6kcdl3nm6', 'customer', '0815000005'),
(6, 1, 'Siti Rahma', 'siti@customer.local', '$2y$12$bz350OlJuLRL/eGWYtjcPuej9dtTupKuMMxQxxz2lbaJ6kcdl3nm6', 'customer', '0816000006'),
(7, 2, 'Joko Widodo', 'joko@customer.local', '$2y$12$bz350OlJuLRL/eGWYtjcPuej9dtTupKuMMxQxxz2lbaJ6kcdl3nm6', 'customer', '0817000007'),
(8, 2, 'Dewi Lestari', 'dewi@customer.local', '$2y$12$bz350OlJuLRL/eGWYtjcPuej9dtTupKuMMxQxxz2lbaJ6kcdl3nm6', 'customer', '0818000008');

-- 3. Addresses
INSERT INTO addresses (id, user_id, recipient_name, phone, address_line, city, postal_code, is_default) VALUES
(1, 5, 'Budi Santoso', '0815000005', 'Jl. Melati Blok C2 No. 12, Tebet', 'Jakarta Selatan', '12810', 1),
(2, 5, 'Kantor Budi Santoso', '0815000005', 'Gedung Menara Sudirman Lt. 8, Senayan', 'Jakarta Pusat', '10270', 0),
(3, 6, 'Siti Rahma', '0816000006', 'Perum Indah Regency Blok B No. 8', 'Tangerang', '15111', 1),
(4, 7, 'Joko Widodo', '0817000007', 'Jl. Diponegoro No. 45, Wonokromo', 'Surabaya', '60241', 1),
(5, 8, 'Dewi Lestari', '0818000008', 'Jl. Pemuda No. 101, Simpang Lima', 'Semarang', '50132', 1);

-- 4. Products (12 items)
INSERT INTO products (id, tenant_id, sku, name, description, category, price, stock, unit) VALUES
(1, 1, 'PRD-001', 'Panci Stainless Steel 24cm', 'Panci anti karat tebal dengan tutup kaca tempered dan pegangan anti panas.', 'Peralatan Masak', 150000.00, 45, 'pcs'),
(2, 1, 'PRD-002', 'Wajan Anti Lengket Teflon 28cm', 'Wajan penggorengan lapisan granit marble anti gores, cocok untuk kompor induksi.', 'Peralatan Masak', 185000.00, 30, 'pcs'),
(3, 1, 'PRD-003', 'Set Pisau Dapur Chef 6-in-1', 'Set pisau stainless steel tajam lengkap dengan gunting dapur dan tempat pisau.', 'Peralatan Masak', 120000.00, 60, 'set'),
(4, 1, 'PRD-004', 'Sapu & Pengki Otomatis Lipat', 'Sapu serat padat dan pengki berigi pembersih debu praktis dan hemat tempat.', 'Kebersihan', 75000.00, 80, 'set'),
(5, 1, 'PRD-005', 'Tempat Sampah Sensor Pintar 12L', 'Tempat sampah buka tutup otomatis dengan sensor inframerah anti bau.', 'Kebersihan', 220000.00, 25, 'unit'),
(6, 1, 'PRD-006', 'Rak Piring Minimalis 2 Susun', 'Rak piring stainless steel anti karat dengan nampan penampung air.', 'Dapur & Ruang Makan', 135000.00, 40, 'unit'),
(7, 1, 'PRD-007', 'Dispenser Sabun Cuci Tangan Otomatis', 'Dispenser sabun busa otomatis dengan baterai isi ulang USB.', 'Kamar Mandi', 95000.00, 55, 'unit'),
(8, 1, 'PRD-008', 'Blender Kaca Multifungsi 1.5L', 'Blender 4 mata pisau stainless cocok untuk bumbu halus dan jus buah.', 'Elektronik Dapur', 310000.00, 20, 'unit'),
(9, 2, 'PRD-009', 'Magic Com Digital Rice Cooker 1.8L', 'Penanak nasi serbaguna dengan 8 mode memasak dan panci keramik anti lengket.', 'Elektronik Dapur', 450000.00, 15, 'unit'),
(10, 2, 'PRD-010', 'Kotak Penyimpanan Transparan 30L', 'Kotak storage box plastik tebal dengan roda dan kunci pengaman tutup.', 'Penyimpanan', 65000.00, 100, 'pcs'),
(11, 2, 'PRD-011', 'Set Handuk Katun Premium 3 Pcs', 'Handuk mandi serat katun halus dengan daya serap tinggi ukuran 70x140cm.', 'Kamar Mandi', 110000.00, 70, 'set'),
(12, 2, 'PRD-012', 'Pel Lantai Putar Microfiber 360', 'Alat pel putar peras otomatis tanpa mengotori tangan dengan ember ganda.', 'Kebersihan', 140000.00, 35, 'set');

-- 5. Coupons
INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase, max_uses_per_user, is_active) VALUES
(1, 'HEMAT10', 'percentage', 10.00, 100000.00, 1, 1),
(2, 'DISKON50K', 'fixed', 50000.00, 250000.00, 1, 1),
(3, 'GRATISONGKIR', 'fixed', 20000.00, 150000.00, 1, 1);

-- 6. Orders (8 orders)
INSERT INTO orders (id, order_number, tenant_id, customer_id, status, subtotal, discount, shipping_cost, grand_total, coupon_code, shipping_address_id, created_at) VALUES
(1, 'ORD-2026-0001', 1, 5, 'delivered', 335000.00, 0.00, 15000.00, 350000.00, NULL, 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 'ORD-2026-0002', 1, 5, 'processing', 220000.00, 22000.00, 20000.00, 218000.00, 'HEMAT10', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 'ORD-2026-0003', 1, 6, 'pending', 185000.00, 0.00, 15000.00, 200000.00, NULL, 3, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 'ORD-2026-0004', 1, 6, 'shipped', 450000.00, 50000.00, 20000.00, 420000.00, 'DISKON50K', 3, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, 'ORD-2026-0005', 2, 7, 'confirmed', 270000.00, 0.00, 20000.00, 290000.00, NULL, 4, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(6, 'ORD-2026-0006', 2, 7, 'processing', 310000.00, 31000.00, 20000.00, 299000.00, 'HEMAT10', 4, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(7, 'ORD-2026-0007', 2, 8, 'delivered', 140000.00, 0.00, 15000.00, 155000.00, NULL, 5, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(8, 'ORD-2026-0008', 2, 8, 'cancelled', 120000.00, 0.00, 15000.00, 135000.00, NULL, 5, DATE_SUB(NOW(), INTERVAL 5 DAY));

-- 7. Order Items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 1, 1, 150000.00, 150000.00),
(2, 1, 2, 1, 185000.00, 185000.00),
(3, 2, 5, 1, 220000.00, 220000.00),
(4, 3, 2, 1, 185000.00, 185000.00),
(5, 4, 9, 1, 450000.00, 450000.00),
(6, 5, 6, 2, 135000.00, 270000.00),
(7, 6, 8, 1, 310000.00, 310000.00),
(8, 7, 12, 1, 140000.00, 140000.00),
(9, 8, 3, 1, 120000.00, 120000.00);

-- 8. Shipments (4 invoices / shipping records)
INSERT INTO shipments (id, order_id, tracking_number, courier, shipping_date, delivery_status, label_format, notes) VALUES
(1, 1, 'JNE-REG-2026001', 'JNE Reguler', DATE_SUB(NOW(), INTERVAL 9 DAY), 'delivered', 'standard', 'Diterima oleh security penerima'),
(2, 2, 'SICEPAT-BEST-2026002', 'SiCepat BEST', NULL, 'manifested', 'thermal_100x150', 'Paket telah dipacking di gudang utama'),
(3, 4, 'JNT-EXP-2026004', 'J&T Express', DATE_SUB(NOW(), INTERVAL 1 DAY), 'in_transit', 'pdf', 'Sedang dalam perjalanan ke drop point Tangerang'),
(4, 7, 'ANTERAJA-REG-2026007', 'AnterAja Reguler', DATE_SUB(NOW(), INTERVAL 6 DAY), 'delivered', 'standard', 'Paket diletakkan di teras sesuai instruksi');

-- 9. Order Notes (Catatan internal)
INSERT INTO order_notes (id, order_id, author_id, note_type, content, created_at) VALUES
(1, 1, 3, 'internal', 'Barang dipacking menggunakan bubble wrap tebal 3 lapis.', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 2, 2, 'internal', 'Prioritas pengiriman untuk pelanggan VIP. Harap cek fungsi sensor sebelum kirim.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 4, 3, 'internal', 'Panci rice cooker sudah diperiksa, kondisi mulus tanpa baret.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 5, 4, 'internal', 'Konfirmasi via WhatsApp sebelum kurir berangkat.', DATE_SUB(NOW(), INTERVAL 4 DAY));

-- 10. Coupon Usages
INSERT INTO coupon_usages (id, coupon_id, user_id, order_id, used_at) VALUES
(1, 1, 5, 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 2, 6, 4, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 1, 7, 6, DATE_SUB(NOW(), INTERVAL 1 DAY));

