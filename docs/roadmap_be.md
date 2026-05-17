# Roadmap Pengembangan Backend API - Sistem Manajemen Warung Bakso

Dokumen ini adalah panduan langkah demi langkah (*checklist*) untuk pengembangan REST API menggunakan Laravel 11. 
Berikan tanda centang (`[x]`) pada fitur yang sudah diselesaikan.

---

## 🚀 Fase 1: Fondasi Sistem & Keamanan (Selesai)
Fase ini memastikan struktur database berdiri dan sistem autentikasi berjalan dengan aman.

- [x] Konfigurasi `.env` dan Database MySQL
- [x] Pembuatan Migration (Urutan yang benar: Users, Tables, Categories, Menus, Orders, Order_items)
- [x] Pembuatan Eloquent Models & Relasi antar tabel
- [x] Instalasi & Konfigurasi Laravel Sanctum
- [x] Pembuatan `AuthController` (Login, Logout, Me)
- [x] Pembuatan Trait `ApiResponse` untuk standardisasi format JSON

---

## 📦 Fase 2: Master Data (Katalog Produk)
Fase ini bertujuan untuk mengelola data inti aplikasi yang akan sering dipanggil oleh antarmuka kasir dan pelanggan.

### 1. Manajemen Kategori (Category)
- [ ] Buat `CategoryResource` (Formatting output JSON)
- [ ] Buat `CategoryRequest` (Validasi input form)
- [ ] Buat `Api/CategoryController` (Fitur CRUD: Index, Store, Show, Update, Destroy)
- [ ] Daftarkan Route API di `routes/api.php`

### 2. Manajemen Menu (Menu)
- [ ] Buat `MenuResource`
- [ ] Buat `MenuRequest` (Validasi: nama, harga numerik, upload gambar)
- [ ] Buat `Api/MenuController` (Fitur CRUD termasuk penanganan file gambar)
- [ ] Daftarkan Route API

---

## 🪑 Fase 3: Manajemen Meja & QR Code (F-01 & F-06)
Mengelola status meja agar sinkron dengan pesanan dan memfasilitasi pemesanan mandiri oleh pelanggan.

- [ ] Buat `TableResource`
- [ ] Buat `TableRequest`
- [ ] Buat `Api/TableController` (CRUD meja & Update status: kosong/terisi)
- [ ] Buat endpoint khusus `Generate QR Code` per meja (mengembalikan URL atau token unik)

---

## 🛒 Fase 4: Transaksi & Pemesanan (F-02)
Ini adalah *core engine* aplikasi. Karena melibatkan banyak tabel (Orders & Order Items), kita akan menggunakan `DB::transaction`.

- [ ] Buat `OrderResource` dan `OrderItemResource`
- [ ] Buat `StoreOrderRequest` (Validasi array item pesanan dari frontend)
- [ ] Buat `Api/OrderController`
- [ ] Implementasi fitur **Create Order** (Kasir & QR) dengan pemotongan *snapshot* harga menu saat itu.
- [ ] Implementasi fitur **Update Status Order** (Pending -> Diproses -> Selesai)
- [ ] Implementasi fitur get detail order (Invoice)

---

## 🍳 Fase 5: Kitchen Display System / KDS (F-03)
Fitur khusus untuk layar dapur untuk memperbarui status makanan per *item*.

- [ ] Buat `Api/KdsController`
- [ ] Implementasi endpoint GET antrean pesanan aktif (Status: pending/diproses)
- [ ] Implementasi endpoint PUT untuk update `item_status` (pending -> dimasak -> selesai)
- [ ] *(Opsional di tahap ini)* Setup Laravel Reverb untuk notifikasi WebSocket real-time ke layar dapur.

---

## 💳 Fase 6: Pembayaran & Laporan (F-04 & F-07)
Penyelesaian transaksi dan agregasi data untuk pemilik warung.

- [ ] Tambahkan endpoint POST untuk **Checkout / Proses Pembayaran** di `OrderController` (Update status meja jadi kosong, order jadi lunas).
- [ ] Buat `Api/ReportController`
- [ ] Implementasi query agregasi untuk Laporan Harian (Total pendapatan, menu terlaris)
- [ ] Implementasi export laporan (Format PDF/Excel)

---

## 🧪 Fase 7: Finalisasi & Dokumentasi
- [ ] Uji coba seluruh endpoint menggunakan Postman
- [ ] Ekspor file `postman_collection.json` untuk diserahkan ke tim Frontend React.js
- [ ] Merapikan folder public/storage untuk gambar menu