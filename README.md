# KiosKita — Sistem Manajemen Pesanan & Gudang Distribusi

> ⚠️ **LOCAL SECURITY TRAINING LAB — DATA DUMMY**  
> Aplikasi ini dirancang khusus untuk latihan analisis source code dan secure coding dalam lingkungan lokal Docker yang terisolasi. Seluruh data transaksi, nama pelanggan, entitas usaha, dan kredensial dalam aplikasi ini adalah fiktif. Jangan mendeploy aplikasi ini ke internet atau jaringan produksi.

---

## Ringkasan Aplikasi
**KiosKita** adalah sistem operasional dan dashboard manajemen pesanan untuk usaha distribusi perlengkapan rumah tangga (seperti CV Sumber Rejeki dan UD Berkah Jaya). Sistem ini mengelola alur bisnis:
- Pemesanan dan katalog produk perlengkapan rumah tangga.
- Keranjang belanja dan validasi kupon promosi.
- Riwayat pesanan, rincian faktur penjualan, dan pencatatan instruksi gudang (catatan internal).
- Pelacakan resi pengiriman dan pembuatan label pengiriman berbasis utilitas CLI.
- Manajemen buku alamat pengiriman pelanggan dan profil akun.
- Manajemen pengguna internal untuk staf dan manajer operasional.

## Arsitektur Stack
Aplikasi dibangun menggunakan arsitektur monorepo multi-tier:
- **Frontend (`web/`)**: Vue 3 + Vite, antarmuka responsif berbahasa Indonesia dengan Pico CSS.
- **BFF / API Gateway (`bun-api/`)**: Bun runtime + TypeScript, menangani sesi JWT, katalog produk, buku alamat, profil, dan agregasi data operasional.
- **Legacy Backend (`php-api/`)**: PHP 8.3 Apache, menangani pesanan lama, faktur, promosi, dan engine pemrosesan label pengiriman.
- **Database (`database/`)**: MySQL 8.0 dengan skema relasional dan seed data awal otomatis.

---

## Prasyarat Lingkungan
- **Docker Engine** (versi 24.0+ disarankan)
- **Docker Compose** (versi v2.20+)
- Port bebas pada host: `8080` (Web UI & Reverse Proxy API) dan `3000` (Direct Bun BFF API Gateway).

---

## Cara Menjalankan Aplikasi

1. Pindah ke direktori proyek KiosKita:
   ```bash
   cd KiosKita
   ```

2. Jalankan seluruh layanan dengan Docker Compose:
   ```bash
   docker compose up -d --build
   ```

3. Tunggu hingga seluruh kontainer dalam status sehat (*healthy/running*):
   ```bash
   docker compose ps
   ```

4. Akses aplikasi melalui browser web:
   - **URL Web Dashboard**: [http://localhost:8080](http://localhost:8080)
   - **API Gateway (Bun BFF)**: [http://localhost:3000](http://localhost:3000) (juga diproxy secara transparan oleh Web di `http://localhost:8080/api`)

---

## Akun Pengguna Dummy Lab
Semua akun menggunakan kata sandi seragam: `password123`.

| Email Akun | Peran (Role) | Unit Usaha / Tenant | Keterangan |
|---|---|---|---|
| `admin@kioskita.local` | `admin` | CV Sumber Rejeki | Administrator Pusat (akses menu Kelola User) |
| `manager@kioskita.local` | `manager` | CV Sumber Rejeki | Manajer Operasional Distribusi |
| `staff1@kioskita.local` | `staff` | CV Sumber Rejeki | Staf Operasional Gudang 1 |
| `staff2@kioskita.local` | `staff` | UD Berkah Jaya | Staf Operasional Gudang 2 |
| `budi@customer.local` | `customer` | CV Sumber Rejeki | Pelanggan 1 (memiliki pesanan ORD-2026-0001 dsb.) |
| `siti@customer.local` | `customer` | CV Sumber Rejeki | Pelanggan 2 |
| `joko@customer.local` | `customer` | UD Berkah Jaya | Pelanggan 3 |
| `dewi@customer.local` | `customer` | UD Berkah Jaya | Pelanggan 4 |

> *Catatan: Pada halaman login, tersedia tombol cepat satu klik untuk memilih akun tanpa perlu mengetik.*

---

## Panduan Penggunaan Fitur

1. **Katalog & Pemesanan**:
   - Masuk sebagai pelanggan (misal: `budi@customer.local`).
   - Buka menu **Katalog** untuk melihat 12 perlengkapan rumah tangga.
   - Klik **Tambah ke Keranjang**, lalu buka menu **Keranjang**.
   - Masukkan kode kupon yang tersedia (contoh: `HEMAT10`, `DISKON50K`, atau `GRATISONGKIR`).
   - Pilih alamat pengiriman dan selesaikan pesanan.
2. **Manajemen Pesanan & Gudang**:
   - Buka menu **Pesanan** untuk melihat daftar riwayat.
   - Gunakan fitur pencarian nomor pesanan atau filter status.
   - Buka detail pesanan untuk melihat barang, status, dan riwayat catatan internal gudang.
   - Staf dapat menambahkan catatan internal terkait pengecekan barang atau instruksi ekspedisi.
3. **Pengiriman & Dokumen**:
   - Buka menu **Pengiriman** untuk melihat nomor resi aktif.
   - Klik **Preview Label** untuk melihat simulasi label pengiriman melalui engine format label.
   - Buka **Faktur** untuk melihat lembar penagihan resmi yang siap cetak.
4. **Buku Alamat & Profil**:
   - Buka menu **Profil** untuk mengubah data diri dan mengelola alamat pengiriman.
5. **Manajemen User (Admin)**:
   - Masuk sebagai `admin@kioskita.local` dan akses menu **Kelola User** untuk menambahkan anggota tim operasional baru.

---

## Pemantauan Log Kontainer
Untuk memantau aktivitas server dan request secara *real-time*:
```bash
# Log seluruh layanan
docker compose logs -f

# Log khusus API Gateway (Bun)
docker compose logs -f bun-api

# Log khusus Legacy Backend (PHP)
docker compose logs -f php-api
```

---

## Cara Reset Data Lab
Jika data transaksi atau database telah dimodifikasi dan Anda ingin mengembalikan ke kondisi *seed* awal:
```bash
docker compose down -v
docker compose up -d --build
```
Perintah `down -v` akan menghapus volume database Docker dan memicu inisialisasi ulang skema serta *seed dummy* secara otomatis saat layanan dihidupkan kembali.

# lab-kioskita
