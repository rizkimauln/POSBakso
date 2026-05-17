# Backend Implementation Guide - POS Warung Bakso

Panduan ini dibuat sebagai urutan kerja backend Laravel 13 untuk POS Warung Bakso. Fokusnya bukan hanya fitur jalan, tetapi struktur yang rapi, mudah dirawat, dan nyaman dipakai oleh frontend React.js.

## Tujuan Backend

- Menyediakan REST API stabil untuk React.js.
- Memisahkan tanggung jawab dengan jelas: Controller, Request, Resource, Service, Model, dan Policy/Middleware.
- Menjaga transaksi order dan pembayaran tetap aman memakai `DB::transaction`.
- Membuat response JSON konsisten agar frontend mudah membaca status, pesan, data, error, dan pagination.
- Menyiapkan dokumentasi endpoint serta collection API untuk testing dan handoff frontend.

## Kondisi Proyek Saat Ini

- Framework: Laravel `^13.7`.
- Auth API: Laravel Sanctum sudah terpasang.
- Model awal sudah ada: `User`, `Category`, `Menu`, `Table`, `Order`, `OrderItem`.
- Route API baru berisi auth dasar: `login`, `me`, `logout`.
- Roadmap lama ada di `docs/roadmap_be.md`, tetapi masih menyebut Laravel 11.
- Perlu audit fondasi karena `ApiResponse` belum terlihat di folder `app/`, sementara roadmap lama menandai fitur itu selesai.
- Perlu koreksi migration `orders` dan `order_items`: method `down()` terlihat tertukar.

## Struktur Folder Target

Struktur ini tetap Laravel-native, tetapi cukup profesional untuk tumbuh.

```text
app/
  Actions/
    Orders/
      CreateOrderAction.php
      CheckoutOrderAction.php
      UpdateOrderStatusAction.php
  DTOs/
    Orders/
      OrderItemData.php
  Enums/
    OrderStatus.php
    PaymentMethod.php
    PaymentStatus.php
    TableStatus.php
    OrderItemStatus.php
    UserRole.php
  Exceptions/
    ApiException.php
  Http/
    Controllers/
      Api/
        AuthController.php
        CategoryController.php
        MenuController.php
        TableController.php
        OrderController.php
        KdsController.php
        ReportController.php
    Middleware/
      EnsureUserRole.php
    Requests/
      Auth/
        LoginRequest.php
      Categories/
        StoreCategoryRequest.php
        UpdateCategoryRequest.php
      Menus/
        StoreMenuRequest.php
        UpdateMenuRequest.php
      Tables/
        StoreTableRequest.php
        UpdateTableRequest.php
      Orders/
        StoreOrderRequest.php
        UpdateOrderStatusRequest.php
        CheckoutOrderRequest.php
      Kds/
        UpdateOrderItemStatusRequest.php
    Resources/
      CategoryResource.php
      MenuResource.php
      TableResource.php
      OrderResource.php
      OrderItemResource.php
      UserResource.php
  Models/
  Policies/
  Services/
    CategoryService.php
    MenuService.php
    TableService.php
    OrderService.php
    KdsService.php
    ReportService.php
  Support/
    ApiResponse.php
```

Catatan implementasi:

- `Controller` hanya menerima request, memanggil service/action, lalu mengembalikan response.
- `FormRequest` mengurus validasi dan otorisasi input.
- `JsonResource` mengurus bentuk output untuk frontend.
- `Service` mengurus business rule sederhana per modul.
- `Action` dipakai untuk proses penting yang transaksional atau punya banyak langkah, seperti membuat order dan checkout.
- `Enum` dipakai untuk status agar tidak banyak string manual tersebar di kode.
- `Policy` atau role middleware dipakai untuk membatasi akses admin, kasir, dapur, dan pelanggan QR.

## Standar Response API

Semua endpoint memakai format yang konsisten.

### Success

```json
{
  "status": "success",
  "message": "Data berhasil diambil",
  "data": {}
}
```

### Validation Error

```json
{
  "status": "error",
  "message": "Validasi gagal",
  "errors": {
    "name": ["Nama wajib diisi"]
  }
}
```

### Pagination

```json
{
  "status": "success",
  "message": "Data berhasil diambil",
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 25,
    "last_page": 3
  }
}
```

## Konvensi API

- Prefix endpoint: `/api`.
- Protected endpoint memakai `auth:sanctum`.
- Nama route memakai bentuk plural: `/categories`, `/menus`, `/tables`, `/orders`.
- Filter query memakai snake_case: `?is_active=1&category_id=2&status=kosong`.
- Response tanggal memakai ISO string dari Laravel.
- Harga disimpan sebagai integer rupiah, bukan decimal.
- File gambar menu disimpan di disk `public`, path dikirim lewat resource sebagai URL siap pakai.
- Endpoint yang dipakai pelanggan QR dipisah dari endpoint admin/kasir agar permission jelas.

## Role dan Hak Akses

Role final tahap awal:

- `admin`: owner/manager sistem. Bisa kelola user kasir, kategori, menu, meja, QR token, melihat semua order, checkout bila perlu, akses KDS, dan melihat laporan penjualan.
- `kasir`: operasional harian. Bisa membuat order, melihat menu dan meja, update status order/item KDS sederhana, checkout pembayaran, dan melihat invoice.
- `customer`: akses terbatas via QR token, tidak login Sanctum.

KDS tidak memakai role terpisah pada tahap awal. Layar dapur bisa memakai akun `kasir` khusus bila dibutuhkan, sehingga permission tetap sederhana.

## Urutan Pengerjaan

### Fase 0 - Audit dan Rapikan Fondasi

Tujuan: memastikan pondasi backend benar sebelum fitur bertambah.

- [x] Pastikan versi proyek dicatat sebagai Laravel 13 di dokumen.
- [x] Koreksi/verifikasi `down()` migration `orders` dan `order_items`.
- [ ] Jalankan ulang migration di database development.
- [x] Buat `app/Support/ApiResponse.php`.
- [x] Refactor `AuthController` agar memakai `LoginRequest`, `UserResource`, dan `ApiResponse`.
- [x] Tambahkan role default di user factory atau seeder.
- [x] Rapikan model dengan casts enum dan tipe dasar.
- [x] Tambahkan enum status: order, payment, table, order item, user role.
- [x] Jalankan test awal: `php artisan test`.

Definition of Done:

- Migration bisa fresh tanpa error.
- Login, me, dan logout tetap berjalan.
- Semua response auth sudah konsisten.
- Tidak ada status string baru yang ditulis sembarang di controller/service.

### Fase 1 - Master Data Category

Tujuan: menyiapkan CRUD kategori sebagai modul paling sederhana.

- [x] Buat `CategoryResource`.
- [x] Buat `StoreCategoryRequest`.
- [x] Buat `UpdateCategoryRequest`.
- [x] Buat `CategoryService`.
- [x] Buat `CategoryController`.
- [x] Tambahkan route `apiResource('categories', CategoryController::class)`.
- [x] Tambahkan filter/search sederhana: `?search=`.
- [x] Tambahkan pagination di index.
- [ ] Buat feature test untuk index, store, update, destroy.

Endpoint target:

```text
GET    /api/categories
POST   /api/categories
GET    /api/categories/{category}
PUT    /api/categories/{category}
DELETE /api/categories/{category}
```

Definition of Done:

- Frontend bisa mengambil list kategori untuk form menu.
- Nama kategori unik atau minimal tervalidasi agar tidak duplikat tanpa sengaja.
- Delete kategori aman terhadap menu terkait sesuai keputusan bisnis.

### Fase 2 - Master Data Menu

Tujuan: mengelola katalog menu yang akan dipakai kasir, pelanggan QR, dan laporan.

- [x] Buat `MenuResource`.
- [x] Buat `StoreMenuRequest`.
- [x] Buat `UpdateMenuRequest`.
- [x] Buat `MenuService`.
- [x] Buat `MenuController`.
- [x] Implement upload gambar menu ke `storage/app/public/menus`.
- [x] Pastikan `php artisan storage:link` sudah dilakukan di development.
- [x] Tambahkan filter: `category_id`, `is_active`, `search`.
- [x] Tambahkan endpoint toggle aktif/nonaktif bila dibutuhkan.
- [ ] Buat feature test CRUD menu dan upload gambar.

Endpoint target:

```text
GET    /api/menus
POST   /api/menus
GET    /api/menus/{menu}
PUT    /api/menus/{menu}
DELETE /api/menus/{menu}
PATCH  /api/menus/{menu}/toggle-active
```

Definition of Done:

- Frontend mendapat `image_url`, bukan hanya `image_path`.
- Menu nonaktif tidak muncul di endpoint publik/customer.
- Harga tervalidasi integer minimal 0.

### Fase 3 - Manajemen Meja dan QR

Tujuan: setiap meja punya status dan QR token untuk order mandiri.

- [x] Buat `TableResource`.
- [x] Buat `StoreTableRequest`.
- [x] Buat `UpdateTableRequest`.
- [x] Buat `TableService`.
- [x] Buat `TableController`.
- [x] Generate `qr_token` otomatis saat meja dibuat.
- [x] Buat endpoint regenerate QR token.
- [x] Buat endpoint publik untuk resolve QR token menjadi data meja.
- [x] Tambahkan validasi status meja.
- [ ] Buat feature test meja dan QR token.

Endpoint target:

```text
GET    /api/tables
POST   /api/tables
GET    /api/tables/{table}
PUT    /api/tables/{table}
DELETE /api/tables/{table}
PATCH  /api/tables/{table}/status
POST   /api/tables/{table}/regenerate-qr
GET    /api/public/tables/{qr_token}
```

Definition of Done:

- Setiap meja punya token unik.
- Endpoint publik tidak membocorkan data internal.
- Status meja berubah sesuai lifecycle order dan checkout.

### Fase 4 - Order Core Engine

Tujuan: membuat proses pesanan aman, atomik, dan mudah ditelusuri.

- [x] Buat `OrderResource`.
- [x] Buat `OrderItemResource`.
- [x] Buat `StoreOrderRequest`.
- [x] Buat `UpdateOrderStatusRequest`.
- [x] Buat `OrderService`.
- [x] Buat `CreateOrderAction` dengan `DB::transaction`.
- [x] Hitung `total_amount` dari snapshot harga menu di database.
- [x] Simpan `user_id` jika order dibuat kasir.
- [x] Izinkan `user_id` null untuk order dari QR.
- [x] Update status meja menjadi `terisi` saat order dibuat.
- [x] Buat endpoint detail invoice.
- [ ] Buat feature test create order, validation, total, dan status meja.

Endpoint target:

```text
GET    /api/orders
POST   /api/orders
GET    /api/orders/{order}
PATCH  /api/orders/{order}/status
GET    /api/orders/{order}/invoice
POST   /api/public/orders
```

Payload create order:

```json
{
  "table_id": 1,
  "items": [
    {
      "menu_id": 1,
      "quantity": 2,
      "notes": "Tidak pakai sambal"
    }
  ]
}
```

Definition of Done:

- Total order tidak percaya pada harga dari frontend.
- Semua item menyimpan snapshot `price`.
- Bila salah satu item invalid, tidak ada data order setengah jadi.

### Fase 5 - Kitchen Display System

Tujuan: dapur bisa melihat antrean dan update status per item.

- [x] Buat `KdsController`.
- [x] Buat `KdsService`.
- [x] Buat `UpdateOrderItemStatusRequest`.
- [x] Endpoint antrean hanya mengambil order `pending` dan `diproses`.
- [x] Endpoint update item status: `pending`, `dimasak`, `selesai`.
- [x] Saat semua item selesai, order bisa otomatis menjadi `selesai` atau menunggu aksi kasir, pilih satu aturan.
- [ ] Buat feature test antrean KDS dan update item.

Endpoint target:

```text
GET   /api/kds/orders
PATCH /api/kds/order-items/{orderItem}/status
```

Definition of Done:

- Dapur tidak perlu melihat data pembayaran.
- Update item status tidak merusak total order.
- Query sudah eager load relasi yang diperlukan agar tidak N+1.

### Fase 6 - Checkout dan Pembayaran

Tujuan: menyelesaikan transaksi dan mengosongkan meja.

- [x] Buat `CheckoutOrderRequest`.
- [x] Buat `CheckoutOrderAction` dengan `DB::transaction`.
- [x] Validasi order belum lunas sebelum checkout.
- [x] Simpan `payment_method`.
- [x] Update `payment_status` menjadi `lunas`.
- [x] Update status meja menjadi `kosong`.
- [x] Pastikan order sudah `selesai` atau tentukan apakah checkout boleh saat belum selesai.
- [ ] Buat feature test checkout berhasil dan gagal.

Endpoint target:

```text
POST /api/orders/{order}/checkout
```

Payload checkout:

```json
{
  "payment_method": "tunai"
}
```

Definition of Done:

- Order tidak bisa checkout dua kali.
- Meja kembali kosong setelah pembayaran.
- Response checkout cukup lengkap untuk receipt frontend.

### Fase 7 - Laporan

Tujuan: pemilik bisa melihat ringkasan penjualan.

- [x] Buat `ReportController`.
- [x] Buat `ReportService`.
- [x] Endpoint laporan harian.
- [x] Endpoint laporan rentang tanggal.
- [x] Query total pendapatan hanya dari order `lunas`.
- [x] Query menu terlaris dari order item.
- [x] Tambahkan filter `from`, `to`, dan `payment_method`.
- [ ] Buat test agregasi laporan.

Endpoint target:

```text
GET /api/reports/daily?date=2026-05-17
GET /api/reports/sales?from=2026-05-01&to=2026-05-17
GET /api/reports/best-selling-menus?from=2026-05-01&to=2026-05-17
```

Definition of Done:

- Angka laporan konsisten dengan data order lunas.
- Response mudah dirender menjadi dashboard React.
- Query cukup efisien untuk data kecil sampai menengah.

### Fase 8 - User dan Role Management

Tujuan: admin bisa mengelola akun kasir dan dapur.

- [x] Buat `UserResource`.
- [x] Buat request store/update user.
- [x] Buat `UserController`.
- [x] Hash password hanya saat password dikirim.
- [x] Role middleware diterapkan ke endpoint admin.
- [ ] Buat feature test permission role.

Endpoint target:

```text
GET    /api/users
POST   /api/users
GET    /api/users/{user}
PUT    /api/users/{user}
DELETE /api/users/{user}
```

Definition of Done:

- Hanya admin yang bisa kelola user.
- User tidak bisa melihat password/hash.
- Role invalid ditolak oleh validasi.

### Fase 9 - Dokumentasi, Testing, dan Handoff FE

Tujuan: backend siap dipakai React.js dengan kontrak jelas.

- [ ] Buat dokumentasi endpoint di `docs/api_contract.md`.
- [ ] Buat Postman collection atau Insomnia collection.
- [ ] Tambahkan contoh payload sukses dan error.
- [ ] Tambahkan seed data realistis: admin, kasir, kategori, menu, meja.
- [ ] Jalankan `php artisan test`.
- [ ] Jalankan Laravel Pint: `vendor/bin/pint`.
- [ ] Pastikan CORS sesuai origin React development.
- [ ] Pastikan `.env.example` memuat konfigurasi yang diperlukan.

Definition of Done:

- Frontend tahu endpoint, method, payload, response, dan auth flow.
- Developer baru bisa setup proyek dari README tanpa tebak-tebakan.
- Test utama untuk auth, master data, order, checkout, dan laporan hijau.

## Rekomendasi Urutan Eksekusi Praktis

Mulai dari Fase 0 dulu. Setelah fondasi benar, kerjakan modul dari yang paling kecil ke paling kritikal:

1. Fase 0: Audit fondasi.
2. Fase 1: Category.
3. Fase 2: Menu.
4. Fase 3: Table dan QR.
5. Fase 4: Order core.
6. Fase 6: Checkout.
7. Fase 5: KDS.
8. Fase 7: Report.
9. Fase 8: User management.
10. Fase 9: Dokumentasi dan final QA.

KDS boleh dikerjakan setelah order core, tetapi checkout lebih baik dibuat dulu agar lifecycle transaksi dari pesan sampai bayar cepat utuh.

## Checklist Standar Setiap Modul

Gunakan pola ini untuk setiap fitur CRUD atau fitur domain.

- [ ] Migration sudah benar.
- [ ] Model fillable dan relasi sudah benar.
- [ ] Enum dibuat bila ada status tetap.
- [ ] Request validasi dibuat.
- [ ] Resource response dibuat.
- [ ] Service/action dibuat untuk business logic.
- [ ] Controller tipis dan tidak penuh logic.
- [ ] Route terdaftar dengan middleware yang tepat.
- [ ] Feature test minimal happy path dan validation error.
- [ ] Dokumentasi endpoint ditambah.

## Catatan untuk React.js Frontend

- Frontend login ke `POST /api/login`, simpan token, lalu kirim `Authorization: Bearer {token}`.
- Jangan kirim harga menu dari frontend saat membuat order.
- Frontend cukup kirim `menu_id`, `quantity`, dan `notes`.
- Untuk upload menu, gunakan `multipart/form-data`.
- Untuk list yang besar, gunakan pagination dari backend.
- Untuk QR customer, frontend bisa membuka halaman berdasarkan `qr_token`, lalu memanggil endpoint publik.

## Realtime KDS dengan Laravel Reverb

Backend memakai Laravel Reverb untuk live update admin/kasir melalui private channel:

```text
private-kds.orders
```

Customer QR menerima update melalui public channel berbasis token order:

```text
orders.{public_token}
```

`public_token` dikirim di response create order. Token ini acak dan dipakai frontend customer untuk mendengar status order tanpa login.

Event yang dikirim backend:

```text
.order.created
.order.status.updated
.order.item.status.updated
.order.completed
```

Trigger event:

- `OrderCreated`: saat order dibuat oleh kasir atau public QR.
- `OrderStatusUpdated`: saat kasir/admin mengubah status order.
- `OrderItemStatusUpdated`: saat status item KDS berubah.
- `OrderCompleted`: saat semua item dalam order sudah `selesai`.

Channel event:

- Admin/kasir mendengar `private-kds.orders` untuk `.order.created`, `.order.status.updated`, `.order.item.status.updated`, dan `.order.completed`.
- Customer mendengar `orders.{public_token}` untuk `.order.status.updated`, `.order.item.status.updated`, dan `.order.completed`.

Command development yang perlu berjalan:

```bash
php artisan serve
php artisan reverb:start
```

Event saat ini memakai `ShouldBroadcastNow`, jadi tidak wajib menjalankan queue worker untuk live KDS. Pastikan Reverb server aktif sebelum mencoba create order atau update status item.

React.js perlu memakai Laravel Echo dan `pusher-js`, lalu autentikasi private channel melalui endpoint Laravel:

```text
POST /broadcasting/auth
```

Request auth channel harus membawa header:

```text
Authorization: Bearer {access_token}
Accept: application/json
```

## Prinsip Kode yang Akan Kita Pakai

- Controller tidak boleh berisi query kompleks.
- Query list diletakkan di service dengan filter eksplisit.
- Semua operasi multi-table memakai transaction.
- Response error harus konsisten.
- Hindari hard delete untuk data transaksi. Untuk master data, pertimbangkan nonaktifkan data dibanding hapus permanen bila sudah dipakai order.
- Nama method harus menggambarkan aksi bisnis, bukan detail teknis.
- Test ditulis saat fitur menyentuh transaksi, pembayaran, permission, dan validasi penting.

## Task Pertama yang Disarankan

Task pertama yang paling sehat adalah Fase 0:

- koreksi migration `down()`,
- buat `ApiResponse`,
- refactor auth,
- buat enum dasar,
- tambah seeder admin/kasir,
- jalankan test.

Setelah itu baru masuk ke Category. Dengan begitu, semua modul berikutnya tinggal mengikuti pola yang sama.
