# Frontend Implementation Guide - POS Warung Bakso

Panduan ini adalah roadmap pengerjaan frontend React.js untuk POS Warung Bakso. Targetnya bukan sekadar tampilan jadi, tetapi frontend yang rapi, mudah dirawat, enak dikembangkan satu per satu, dan siap terhubung ke backend Laravel API + Reverb.

## Tujuan Frontend

- Membuat aplikasi POS berbasis React.js untuk admin dan kasir.
- Membuat halaman customer QR ordering yang mobile-first.
- Menghubungkan frontend ke backend Laravel API.
- Menggunakan Tailwind CSS sebagai styling system utama.
- Menggunakan Reverb + Laravel Echo untuk notifikasi live KDS dan status order customer.
- Menjaga struktur folder jelas: pages, components, services, hooks, contexts, layouts, dan utils.

## Kondisi Proyek Saat Ini

- Monorepo:

```text
backend/   Laravel API + Reverb
frontend/  React.js + Vite + Tailwind CSS
docs/      Dokumentasi project
```

- Frontend sudah dibuat dengan Vite React.
- Tailwind CSS sudah terpasang via `@tailwindcss/vite`.
- Backend sudah punya endpoint auth, master data, meja, order, KDS, checkout, report, user management, dan Reverb.

## Stack Frontend

- React.js
- Vite
- Tailwind CSS
- Axios untuk HTTP client
- React Router untuk routing
- Laravel Echo + `pusher-js` untuk Reverb
- Context atau Zustand untuk state global ringan
- Native `Intl.NumberFormat` untuk format rupiah

Dependency yang perlu ditambahkan nanti:

```bash
npm install axios react-router-dom laravel-echo pusher-js lucide-react
```

Opsional:

```bash
npm install zustand clsx
```

## Struktur Folder Target

```text
frontend/
  src/
    app/
      App.jsx
      router.jsx
      providers.jsx
    assets/
    components/
      common/
        Button.jsx
        Input.jsx
        Select.jsx
        Modal.jsx
        DataTable.jsx
        Badge.jsx
        EmptyState.jsx
        LoadingState.jsx
      layout/
        AppLayout.jsx
        AuthLayout.jsx
        CustomerLayout.jsx
        Sidebar.jsx
        Topbar.jsx
      pos/
        MenuGrid.jsx
        CartPanel.jsx
        TableStatusBadge.jsx
        OrderStatusBadge.jsx
      kds/
        KdsOrderCard.jsx
        KdsItemRow.jsx
    config/
      env.js
      navigation.js
    contexts/
      AuthContext.jsx
    hooks/
      useAuth.js
      useDebounce.js
      useRealtimeKds.js
      useCustomerOrderChannel.js
    lib/
      api.js
      echo.js
      currency.js
      storage.js
    pages/
      auth/
        LoginPage.jsx
      dashboard/
        DashboardPage.jsx
      categories/
        CategoryListPage.jsx
      menus/
        MenuListPage.jsx
        MenuFormModal.jsx
      tables/
        TableListPage.jsx
      orders/
        CashierOrderPage.jsx
        OrderDetailPage.jsx
        CheckoutPage.jsx
      kds/
        KdsPage.jsx
      reports/
        ReportsPage.jsx
      users/
        UserListPage.jsx
      customer/
        CustomerMenuPage.jsx
        CustomerOrderStatusPage.jsx
    services/
      authService.js
      categoryService.js
      menuService.js
      tableService.js
      orderService.js
      kdsService.js
      reportService.js
      userService.js
    styles/
      index.css
    main.jsx
```

Catatan:

- `pages/` berisi screen.
- `components/` berisi UI reusable.
- `services/` berisi semua call API.
- `lib/api.js` mengatur Axios instance dan token.
- `lib/echo.js` mengatur koneksi Reverb.
- `contexts/AuthContext.jsx` menyimpan user login dan token.

## Role Frontend

Role final:

- `admin`: akses semua fitur, termasuk user management dan laporan.
- `kasir`: operasional order, KDS, checkout, invoice, menu/meja read-only atau sesuai kebutuhan.
- `customer`: tidak login, akses via QR token.

Rekomendasi permission UI:

| Fitur | Admin | Kasir | Customer |
| --- | --- | --- | --- |
| Login dashboard | Ya | Ya | Tidak |
| User management | Ya | Tidak | Tidak |
| Category management | Ya | Opsional read-only | Tidak |
| Menu management | Ya | Opsional read-only | Lihat menu aktif |
| Table/QR management | Ya | Lihat status meja | Resolve QR |
| Create order kasir | Ya | Ya | Tidak |
| Create order QR | Tidak | Tidak | Ya |
| KDS | Ya | Ya | Tidak |
| Checkout | Ya | Ya | Tidak |
| Reports | Ya | Tidak atau terbatas | Tidak |

## API dan Environment

Buat file:

```text
frontend/.env
```

Isi development:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_BROADCAST_AUTH_URL=http://localhost:8000/broadcasting/auth
VITE_REVERB_APP_KEY=
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Nilai `VITE_REVERB_APP_KEY` ambil dari `backend/.env` bagian `REVERB_APP_KEY`.

## Standar API Client

Semua request API lewat `src/lib/api.js`.

Respons backend mengikuti format:

```json
{
  "status": "success",
  "message": "Berhasil",
  "data": {}
}
```

Validation error:

```json
{
  "status": "error",
  "message": "Validasi gagal",
  "errors": {}
}
```

Frontend harus:

- Menyimpan token login di storage.
- Mengirim `Authorization: Bearer {token}` untuk protected routes.
- Menampilkan pesan validasi per field.
- Redirect ke login jika API membalas `401`.
- Menampilkan forbidden state jika API membalas `403`.

## Realtime Reverb

Admin/kasir listen channel:

```text
private-kds.orders
```

Event:

```text
.order.created
.order.status.updated
.order.item.status.updated
.order.completed
```

Customer listen channel:

```text
orders.{public_token}
```

Event customer:

```text
.order.status.updated
.order.item.status.updated
.order.completed
```

Command backend development:

```bash
cd backend
php artisan serve
php artisan reverb:start
```

Command frontend development:

```bash
cd frontend
npm run dev
```

## Design Workflow dengan Google Stitch

Gunakan Google Stitch untuk membuat desain awal, lalu implement ulang secara rapi di React + Tailwind.

File desain disarankan disimpan di:

```text
docs/design/
  login.png
  dashboard.png
  cashier-order.png
  kds.png
  customer-menu.png
  customer-status.png
  reports.png
```

Prompt Stitch awal:

```text
Design a modern responsive web dashboard for a Warung Bakso POS system.
The app has two roles: admin and cashier.
Use a clean, professional, operational dashboard style, not a landing page.
Create screens for login, cashier order taking, menu management, table QR management, kitchen display system, checkout invoice, sales reports, and customer QR ordering.
Use React and Tailwind CSS friendly components.
The design should be simple, fast to scan, suitable for a small restaurant cashier and kitchen workflow.
Use warm food-inspired accents but keep the interface professional and not too decorative.
```

## Fase 0 - Setup Fondasi Frontend

Tujuan: membersihkan starter Vite dan menyiapkan fondasi aplikasi.

- [x] Rapikan file starter Vite.
- [x] Buat struktur folder target.
- [x] Install dependency: axios, react-router-dom, laravel-echo, pusher-js, lucide-react.
- [x] Buat `src/lib/api.js`.
- [x] Buat `src/lib/echo.js`.
- [x] Buat `src/lib/currency.js`.
- [x] Buat `src/config/env.js`.
- [x] Buat router dasar.
- [x] Buat layout dasar: `AuthLayout`, `AppLayout`, `CustomerLayout`.
- [x] Buat komponen UI dasar: Button, Input, Select, Modal, Badge, DataTable.
- [x] Pastikan `npm run lint` dan `npm run build` berhasil.

Definition of Done:

- Aplikasi bisa dibuka tanpa starter UI bawaan Vite.
- Struktur folder sudah siap untuk modul lain.
- API client bisa membaca env.

## Fase 1 - Auth dan Protected Routing

Tujuan: user admin/kasir bisa login dan masuk dashboard sesuai role.

- [x] Buat `authService`.
- [x] Buat `AuthContext`.
- [x] Buat `LoginPage`.
- [x] Simpan token dan user setelah login.
- [x] Buat protected route.
- [x] Buat role guard untuk admin-only page.
- [x] Buat logout.
- [x] Buat auto-fetch `/me` saat reload.
- [x] Tangani 401 dari API.

Endpoint:

```text
POST /api/login
GET  /api/me
POST /api/logout
```

Definition of Done:

- User bisa login/logout.
- Token otomatis dikirim ke API.
- Admin dan kasir diarahkan ke dashboard.

## Fase 2 - App Shell Admin/Kasir

Tujuan: membuat kerangka aplikasi dashboard.

- [x] Buat sidebar navigation.
- [x] Buat topbar.
- [x] Buat active navigation state.
- [x] Buat role-based menu.
- [x] Buat dashboard ringkas.
- [x] Buat loading dan empty state global.

Menu admin:

```text
Dashboard, Orders, KDS, Categories, Menus, Tables, Reports, Users
```

Menu kasir:

```text
Dashboard, Orders, KDS, Checkout/Invoice
```

Definition of Done:

- Navigasi nyaman dipakai desktop.
- Role kasir tidak melihat menu admin-only.

## Fase 3 - Master Data Category

Tujuan: admin bisa mengelola kategori.

- [x] Buat `categoryService`.
- [x] Buat halaman list kategori.
- [x] Tambahkan search.
- [x] Tambahkan pagination.
- [x] Tambahkan create/edit modal.
- [x] Tambahkan delete confirm.
- [x] Tampilkan validation error.

Endpoint:

```text
GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

Definition of Done:

- CRUD kategori bisa dipakai admin.
- UI tetap stabil saat data kosong/error/loading.

## Fase 4 - Master Data Menu

Tujuan: admin bisa mengelola menu dan gambar.

- [x] Buat `menuService`.
- [x] Buat list menu dengan filter category dan active.
- [x] Buat create/edit modal.
- [x] Buat upload image preview.
- [x] Buat toggle active.
- [x] Buat delete confirm.
- [x] Format harga rupiah.

Endpoint:

```text
GET    /api/menus
POST   /api/menus
PUT    /api/menus/{id}
DELETE /api/menus/{id}
PATCH  /api/menus/{id}/toggle-active
```

Definition of Done:

- Menu aktif/nonaktif jelas.
- Upload gambar nyaman dan aman.

## Fase 5 - Table dan QR Management

Tujuan: admin bisa mengelola meja dan QR.

- [x] Buat `tableService`.
- [x] Buat list meja.
- [x] Tampilkan status meja.
- [x] Buat create/edit modal.
- [x] Buat update status meja.
- [x] Buat regenerate QR token.
- [x] Tampilkan QR URL customer.
- [x] Tambahkan tombol copy link QR.

Endpoint:

```text
GET    /api/tables
POST   /api/tables
PUT    /api/tables/{id}
DELETE /api/tables/{id}
PATCH  /api/tables/{id}/status
POST   /api/tables/{id}/regenerate-qr
```

Definition of Done:

- Admin bisa menyiapkan meja untuk customer QR.
- Link QR mudah disalin.

## Fase 6 - Cashier Order Page

Tujuan: kasir bisa membuat order cepat.

- [x] Buat `orderService`.
- [x] Buat menu grid.
- [x] Buat cart panel.
- [x] Pilih meja.
- [x] Tambah item ke cart.
- [x] Edit quantity.
- [x] Tambah catatan item.
- [x] Submit order.
- [x] Tampilkan success dan invoice link.

Endpoint:

```text
POST /api/orders
GET  /api/menus?is_active=1
GET  /api/tables
```

Definition of Done:

- Kasir bisa membuat order tanpa refresh.
- Harga di cart hanya preview, backend tetap sumber kebenaran.

## Fase 7 - KDS Live

Tujuan: layar dapur/kasir bisa menerima order live.

- [x] Buat `kdsService`.
- [x] Buat `KdsPage`.
- [x] Fetch initial active orders.
- [x] Listen Reverb private channel `private-kds.orders`.
- [x] Handle `.order.created`.
- [x] Handle `.order.item.status.updated`.
- [x] Handle `.order.completed`.
- [x] Update item status dari UI.
- [x] Buat tampilan besar dan mudah dibaca.

Endpoint:

```text
GET   /api/kds/orders
PATCH /api/kds/order-items/{orderItem}/status
```

Definition of Done:

- Order baru muncul tanpa refresh.
- Status item berubah live.
- Order selesai hilang atau pindah state sesuai desain.

## Fase 8 - Checkout dan Invoice

Tujuan: kasir menyelesaikan pembayaran.

- [x] Buat list order belum lunas.
- [x] Buat detail invoice.
- [x] Buat checkout form.
- [x] Pilih payment method `tunai` atau `qris`.
- [x] Tampilkan receipt setelah checkout.
- [x] Tambahkan print-friendly invoice.

Endpoint:

```text
GET  /api/orders
GET  /api/orders/{id}/invoice
POST /api/orders/{id}/checkout
```

Definition of Done:

- Kasir bisa menyelesaikan order.
- Invoice jelas untuk pelanggan.

## Fase 9 - Reports

Tujuan: admin bisa melihat laporan penjualan.

- [x] Buat `reportService`.
- [x] Buat laporan harian.
- [x] Buat laporan rentang tanggal.
- [x] Buat menu terlaris.
- [x] Tambahkan filter tanggal dan payment method.
- [x] Tampilkan summary cards.
- [x] Tampilkan table menu terlaris.

Endpoint:

```text
GET /api/reports/daily
GET /api/reports/sales
GET /api/reports/best-selling-menus
```

Definition of Done:

- Admin bisa melihat pendapatan dan menu terlaris.
- Angka mudah dibaca dan diformat rupiah.

## Fase 10 - User Management

Tujuan: admin bisa mengelola akun kasir.

- [x] Buat `userService`.
- [x] Buat list user.
- [x] Buat create/edit modal.
- [x] Password wajib saat create.
- [x] Password opsional saat update.
- [x] Role hanya `admin` dan `kasir`.
- [x] Delete confirm.

Endpoint:

```text
GET    /api/users
POST   /api/users
GET    /api/users/{id}
PUT    /api/users/{id}
DELETE /api/users/{id}
```

Definition of Done:

- User management hanya muncul untuk admin.
- Password tidak pernah ditampilkan.

## Fase 11 - Customer QR Ordering

Tujuan: customer bisa order dari QR tanpa login.

- [x] Buat `CustomerMenuPage`.
- [x] Resolve QR token.
- [x] Tampilkan menu aktif.
- [x] Buat cart mobile.
- [x] Submit public order.
- [x] Simpan `public_token` order.
- [x] Redirect ke customer order status page.

Endpoint:

```text
GET  /api/public/tables/{qrToken}
POST /api/public/orders
GET  /api/menus?is_active=1
```

Definition of Done:

- Customer bisa order dari HP.
- UX sederhana dan jelas.

## Fase 12 - Customer Live Order Status

Tujuan: customer mendapat notifikasi status order.

- [x] Buat `CustomerOrderStatusPage`.
- [x] Listen channel `orders.{public_token}`.
- [x] Handle `.order.status.updated`.
- [x] Handle `.order.item.status.updated`.
- [x] Handle `.order.completed`.
- [x] Tampilkan progress: pending, diproses, selesai.

Definition of Done:

- Customer melihat status order tanpa refresh.
- Jika koneksi Reverb belum aktif, tetap tampilkan status terakhir dari state.

## Fase 13 - Polish dan QA

Tujuan: frontend nyaman dipakai dan siap demo.

- [x] Rapikan responsive desktop/mobile.
- [x] Tambahkan toast notification.
- [x] Tambahkan skeleton/loading state.
- [x] Tambahkan empty/error state setiap halaman.
- [x] Pastikan semua form punya validation feedback.
- [x] Pastikan semua action destructive punya confirm.
- [x] Jalankan `npm run lint`.
- [x] Jalankan `npm run build`.
- [x] Test manual flow admin: login, CRUD, report.
- [x] Test manual flow kasir: order, KDS, checkout.
- [x] Test manual flow customer: QR order dan live status.

Definition of Done:

- Tidak ada halaman utama yang blank saat loading/error.
- Build production berhasil.
- Flow demo end-to-end berjalan.

## Urutan Eksekusi Praktis

1. Fase 0: Setup fondasi frontend.
2. Fase 1: Auth.
3. Fase 2: App shell.
4. Fase 3: Category.
5. Fase 4: Menu.
6. Fase 5: Table/QR.
7. Fase 6: Cashier order.
8. Fase 7: KDS live.
9. Fase 8: Checkout/invoice.
10. Fase 9: Reports.
11. Fase 10: User management.
12. Fase 11: Customer QR ordering.
13. Fase 12: Customer live order status.
14. Fase 13: Polish dan QA.

## Checklist Standar Setiap Halaman

- [ ] API service tersedia.
- [ ] Loading state tersedia.
- [ ] Empty state tersedia.
- [ ] Error state tersedia.
- [ ] Form validation tampil jelas.
- [ ] Action sukses memberi feedback.
- [ ] Mobile dan desktop tidak rusak.
- [ ] Role access sesuai.
- [ ] `npm run lint` aman.
- [ ] `npm run build` aman.
