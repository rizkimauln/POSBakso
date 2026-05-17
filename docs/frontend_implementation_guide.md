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

- [ ] Rapikan file starter Vite.
- [ ] Buat struktur folder target.
- [ ] Install dependency: axios, react-router-dom, laravel-echo, pusher-js, lucide-react.
- [ ] Buat `src/lib/api.js`.
- [ ] Buat `src/lib/echo.js`.
- [ ] Buat `src/lib/currency.js`.
- [ ] Buat `src/config/env.js`.
- [ ] Buat router dasar.
- [ ] Buat layout dasar: `AuthLayout`, `AppLayout`, `CustomerLayout`.
- [ ] Buat komponen UI dasar: Button, Input, Select, Modal, Badge, DataTable.
- [ ] Pastikan `npm run lint` dan `npm run build` berhasil.

Definition of Done:

- Aplikasi bisa dibuka tanpa starter UI bawaan Vite.
- Struktur folder sudah siap untuk modul lain.
- API client bisa membaca env.

## Fase 1 - Auth dan Protected Routing

Tujuan: user admin/kasir bisa login dan masuk dashboard sesuai role.

- [ ] Buat `authService`.
- [ ] Buat `AuthContext`.
- [ ] Buat `LoginPage`.
- [ ] Simpan token dan user setelah login.
- [ ] Buat protected route.
- [ ] Buat role guard untuk admin-only page.
- [ ] Buat logout.
- [ ] Buat auto-fetch `/me` saat reload.
- [ ] Tangani 401 dari API.

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

- [ ] Buat sidebar navigation.
- [ ] Buat topbar.
- [ ] Buat active navigation state.
- [ ] Buat role-based menu.
- [ ] Buat dashboard ringkas.
- [ ] Buat loading dan empty state global.

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

- [ ] Buat `categoryService`.
- [ ] Buat halaman list kategori.
- [ ] Tambahkan search.
- [ ] Tambahkan pagination.
- [ ] Tambahkan create/edit modal.
- [ ] Tambahkan delete confirm.
- [ ] Tampilkan validation error.

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

- [ ] Buat `menuService`.
- [ ] Buat list menu dengan filter category dan active.
- [ ] Buat create/edit modal.
- [ ] Buat upload image preview.
- [ ] Buat toggle active.
- [ ] Buat delete confirm.
- [ ] Format harga rupiah.

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

- [ ] Buat `tableService`.
- [ ] Buat list meja.
- [ ] Tampilkan status meja.
- [ ] Buat create/edit modal.
- [ ] Buat update status meja.
- [ ] Buat regenerate QR token.
- [ ] Tampilkan QR URL customer.
- [ ] Tambahkan tombol copy link QR.

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

- [ ] Buat `orderService`.
- [ ] Buat menu grid.
- [ ] Buat cart panel.
- [ ] Pilih meja.
- [ ] Tambah item ke cart.
- [ ] Edit quantity.
- [ ] Tambah catatan item.
- [ ] Submit order.
- [ ] Tampilkan success dan invoice link.

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

- [ ] Buat `kdsService`.
- [ ] Buat `KdsPage`.
- [ ] Fetch initial active orders.
- [ ] Listen Reverb private channel `private-kds.orders`.
- [ ] Handle `.order.created`.
- [ ] Handle `.order.item.status.updated`.
- [ ] Handle `.order.completed`.
- [ ] Update item status dari UI.
- [ ] Buat tampilan besar dan mudah dibaca.

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

- [ ] Buat list order belum lunas.
- [ ] Buat detail invoice.
- [ ] Buat checkout form.
- [ ] Pilih payment method `tunai` atau `qris`.
- [ ] Tampilkan receipt setelah checkout.
- [ ] Tambahkan print-friendly invoice.

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

- [ ] Buat `reportService`.
- [ ] Buat laporan harian.
- [ ] Buat laporan rentang tanggal.
- [ ] Buat menu terlaris.
- [ ] Tambahkan filter tanggal dan payment method.
- [ ] Tampilkan summary cards.
- [ ] Tampilkan table menu terlaris.

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

- [ ] Buat `userService`.
- [ ] Buat list user.
- [ ] Buat create/edit modal.
- [ ] Password wajib saat create.
- [ ] Password opsional saat update.
- [ ] Role hanya `admin` dan `kasir`.
- [ ] Delete confirm.

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

- [ ] Buat `CustomerMenuPage`.
- [ ] Resolve QR token.
- [ ] Tampilkan menu aktif.
- [ ] Buat cart mobile.
- [ ] Submit public order.
- [ ] Simpan `public_token` order.
- [ ] Redirect ke customer order status page.

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

- [ ] Buat `CustomerOrderStatusPage`.
- [ ] Listen channel `orders.{public_token}`.
- [ ] Handle `.order.status.updated`.
- [ ] Handle `.order.item.status.updated`.
- [ ] Handle `.order.completed`.
- [ ] Tampilkan progress: pending, diproses, selesai.

Definition of Done:

- Customer melihat status order tanpa refresh.
- Jika koneksi Reverb belum aktif, tetap tampilkan status terakhir dari state.

## Fase 13 - Polish dan QA

Tujuan: frontend nyaman dipakai dan siap demo.

- [ ] Rapikan responsive desktop/mobile.
- [ ] Tambahkan toast notification.
- [ ] Tambahkan skeleton/loading state.
- [ ] Tambahkan empty/error state setiap halaman.
- [ ] Pastikan semua form punya validation feedback.
- [ ] Pastikan semua action destructive punya confirm.
- [ ] Jalankan `npm run lint`.
- [ ] Jalankan `npm run build`.
- [ ] Test manual flow admin: login, CRUD, report.
- [ ] Test manual flow kasir: order, KDS, checkout.
- [ ] Test manual flow customer: QR order dan live status.

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
