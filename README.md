# POS Bakso - Sistem Point of Sales & Pemesanan Mandiri

POS Bakso adalah sistem kasir (Point of Sales) terpadu yang dirancang khusus untuk warung bakso. Sistem ini menggunakan arsitektur monorepo yang memisahkan antara sistem Backend (API) dan Frontend (Antarmuka Pengguna), dilengkapi dengan fitur pemesanan mandiri oleh pelanggan melalui kode QR.

## Arsitektur Proyek

Sistem ini terdiri dari dua bagian utama:
1. **Backend**: Dibangun menggunakan Laravel. Menangani API, autentikasi (Sanctum), dan komunikasi realtime (Pusher Channels).
2. **Frontend**: Dibangun menggunakan React.js dan Vite dengan Tailwind CSS. Menangani antarmuka pengguna untuk Admin, Kasir, dan Pelanggan.

---

## 1. Persyaratan Sistem (Prerequisites)

Sebelum melakukan instalasi, pastikan sistem Anda telah memiliki perangkat lunak berikut:
- PHP versi 8.3 atau lebih baru
- Composer (Manajer paket PHP)
- MySQL atau MariaDB
- Node.js versi 20 atau lebih baru
- NPM (Manajer paket Node)
- Web Server lokal (Laragon, XAMPP, atau sejenisnya)

---

## 2. Panduan Instalasi (Setup)

### Instalasi Backend (API & Database)

1. Buka terminal dan arahkan ke direktori backend:
   ```bash
   cd backend
   ```

2. Instal semua dependensi PHP:
   ```bash
   composer install
   ```

3. Gandakan file konfigurasi environment:
   ```bash
   copy .env.example .env
   ```
   *(Catatan: Pengguna Mac/Linux gunakan perintah `cp .env.example .env`)*

4. Hasilkan kunci aplikasi Laravel:
   ```bash
   php artisan key:generate
   ```

5. Buat database baru di MySQL dengan nama `warung_bakso_db` (atau sesuai keinginan). Kemudian sesuaikan konfigurasi database pada file `backend/.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=warung_bakso_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```

6. Jalankan migrasi dan seeder untuk membangun struktur tabel dan memasukkan data awal (akun, menu, dan meja):
   ```bash
   php artisan migrate:fresh --seed
   ```

7. Buat tautan simbolik untuk penyimpanan publik (gambar menu):
   ```bash
   php artisan storage:link
   ```

### Instalasi Frontend (Antarmuka Pengguna)

1. Buka tab terminal baru dan arahkan ke direktori frontend:
   ```bash
   cd frontend
   ```

2. Instal semua dependensi Node:
   ```bash
   npm install
   ```

3. Gandakan file konfigurasi environment:
   ```bash
   copy .env.example .env
   ```

4. Sesuaikan konfigurasi pada file `frontend/.env`. Gunakan public key dan cluster Pusher yang sama seperti backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_BROADCAST_AUTH_URL=http://localhost:8000/broadcasting/auth
   
   VITE_PUSHER_APP_KEY=your-pusher-key
   VITE_PUSHER_APP_CLUSTER=ap1
   ```

---

## 3. Menjalankan Aplikasi (Development)

Untuk menjalankan aplikasi secara penuh di lingkungan pengembangan, Anda membutuhkan dua tab terminal yang berjalan bersamaan:

**Terminal 1 (Backend API):**
```bash
cd backend
php artisan serve
```

**Terminal 2 (Frontend Vite Server):**
```bash
cd frontend
npm run dev
```

Aplikasi frontend dapat diakses melalui browser pada alamat yang diberikan oleh Vite (biasanya `http://localhost:5173`).

---

## 4. Cara Penggunaan (Panduan Operasional)

### Akun Sistem Default
Data seeder telah menyiapkan dua jenis peran (role) pengguna:

**Akun Admin**
- Email: `admin@posbakso.test`
- Sandi: `password`
- Hak Akses: Laporan penjualan, manajemen pengguna, dan master data.

**Akun Kasir**
- Email: `kasir@posbakso.test`
- Sandi: `password`
- Hak Akses: Daftar pesanan, transaksi, cetak struk, dan pembaruan status meja.

### Alur Kerja (Workflow) Pemesanan

**1. Pemesanan Mandiri oleh Pelanggan (QR Menu)**
- Pelanggan memindai QR Code di meja (atau membuka tautan QR).
- Sistem mengenali nomor meja pelanggan secara otomatis.
- Pelanggan memilih menu, menambahkan catatan khusus, dan mengirim pesanan.
- Pelanggan akan melihat layar "Status Pesanan" yang akan diperbarui secara realtime.

**2. Penerimaan Pesanan oleh Kasir**
- Kasir login dan membuka halaman "Pesanan Masuk".
- Notifikasi realtime akan muncul jika ada pesanan baru dari pelanggan.
- Kasir memverifikasi pesanan dan mengubah status menjadi "Diproses" (yang akan dikirim ke dapur).
- Status pesanan di layar pelanggan akan otomatis berubah menjadi "Pesanan sedang diproses".

**3. Penyelesaian & Pembayaran (Checkout)**
- Setelah pelanggan selesai makan dan pergi ke meja kasir.
- Kasir membuka pesanan pelanggan tersebut dan menekan tombol "Checkout".
- Kasir memilih metode pembayaran (Tunai atau QRIS) dan memasukkan jumlah uang yang diterima.
- Sistem akan menghitung uang kembalian.
- Status pesanan berubah menjadi "Selesai" (Lunas) dan status meja kembali kosong.
- Kasir dapat mencetak struk/invoice untuk pelanggan.

### Manajemen Sistem (Admin)
- Admin dapat melihat dasbor statistik penjualan harian dan bulanan.
- Admin dapat melihat Laporan (Reports) dan memfilternya berdasarkan tanggal atau metode pembayaran.
- Admin dapat mengatur status aktif/nonaktif sebuah menu.

---

## 5. Saluran Komunikasi (WebSockets)

Aplikasi ini menggunakan Pusher Channels untuk pembaruan instan (tanpa muat ulang halaman):
- `private-kds.orders`: Saluran privat untuk kasir menerima notifikasi pesanan masuk.
- `orders.{public_token}`: Saluran publik spesifik untuk melacak status pesanan tiap pelanggan.

Event utama:
- `OrderCreated`: Ditembakkan ketika pesanan baru masuk.
- `OrderStatusUpdated`: Ditembakkan ketika kasir mengubah status pesanan.
- `OrderCompleted`: Ditembakkan saat pesanan selesai dibayar.
