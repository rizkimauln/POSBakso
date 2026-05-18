# Struktur Folder POS Bakso

Dokumen ini menjelaskan struktur folder project POS Bakso agar pengembangan backend dan frontend tetap konsisten.

## Root Project

```text
posbakso/
|-- backend/
|-- frontend/
|-- docs/
|-- .codex/
|-- .gitignore
`-- README.md
```

| Folder/File | Fungsi |
| --- | --- |
| `backend/` | Aplikasi backend Laravel untuk API, auth, database, storage gambar, laporan, order, checkout, dan realtime event. |
| `frontend/` | Aplikasi frontend React + Vite + Tailwind untuk dashboard admin/kasir dan customer QR ordering. |
| `docs/` | Dokumentasi implementasi, roadmap, dan struktur project. |
| `.codex/` | Konfigurasi lokal Codex/MCP. File sensitif seperti `config.toml` tidak perlu dikomit. |
| `.gitignore` | Daftar file/folder yang diabaikan Git. |
| `README.md` | Dokumentasi ringkas root project. |

## Backend Laravel

```text
backend/
|-- app/
|   |-- Actions/
|   |-- Enums/
|   |-- Events/
|   |-- Http/
|   |   |-- Controllers/
|   |   |-- Middleware/
|   |   |-- Requests/
|   |   `-- Resources/
|   |-- Models/
|   |-- Providers/
|   |-- Services/
|   `-- Support/
|-- bootstrap/
|-- config/
|-- database/
|   |-- factories/
|   |-- migrations/
|   `-- seeders/
|-- public/
|-- resources/
|-- routes/
|-- storage/
|-- tests/
|-- artisan
|-- composer.json
`-- phpunit.xml
```

### `backend/app`

| Folder | Fungsi |
| --- | --- |
| `Actions/` | Use case yang punya langkah bisnis cukup spesifik, misalnya `CreateOrderAction` dan `CheckoutOrderAction`. |
| `Enums/` | Daftar nilai tetap domain, seperti status order, status item, metode pembayaran, status meja, dan role user. |
| `Events/` | Event realtime untuk Reverb, seperti order dibuat, status order berubah, item selesai, dan order selesai. |
| `Http/Controllers/Api/` | Controller API. Controller menerima request, memanggil service/action, lalu mengembalikan response. |
| `Http/Middleware/` | Middleware khusus, misalnya guard role admin/kasir. |
| `Http/Requests/` | Validasi request per fitur. Semua validasi input sebaiknya diletakkan di sini. |
| `Http/Resources/` | Bentuk response JSON API. Resource memastikan format data konsisten untuk frontend. |
| `Models/` | Model Eloquent untuk `User`, `Category`, `Menu`, `Table`, `Order`, dan `OrderItem`. |
| `Services/` | Query dan logika domain yang dipakai controller/action, misalnya pagination, filter, update status, laporan. |
| `Support/` | Helper kecil lintas fitur, seperti `ApiResponse`. |

### `backend/database`

| Folder | Fungsi |
| --- | --- |
| `migrations/` | Definisi struktur tabel database. |
| `seeders/` | Data awal/demo lengkap untuk admin, kasir, kategori, menu, meja, dan order. |
| `factories/` | Factory test/dummy data Laravel. |

### `backend/routes`

| File | Fungsi |
| --- | --- |
| `api.php` | Semua endpoint API utama, termasuk public QR ordering. |
| `channels.php` | Authorization channel broadcast/Reverb. |
| `web.php` | Route web Laravel default. |
| `console.php` | Route/command console Laravel. |

### `backend/storage`

Folder ini dipakai Laravel untuk file runtime, log, cache, session, dan upload publik.

Gambar menu disimpan di:

```text
backend/storage/app/public/menus/
```

Gambar tersebut diakses frontend lewat URL:

```text
http://localhost:8000/storage/menus/{nama-file}
```

Pastikan storage link Laravel sudah tersedia:

```bash
php artisan storage:link
```

## Frontend React

```text
frontend/
|-- public/
|-- src/
|   |-- app/
|   |-- assets/
|   |-- components/
|   |-- config/
|   |-- contexts/
|   |-- hooks/
|   |-- lib/
|   |-- pages/
|   |-- services/
|   |-- styles/
|   `-- main.jsx
|-- index.html
|-- package.json
|-- vite.config.js
`-- eslint.config.js
```

### `frontend/src/app`

| File | Fungsi |
| --- | --- |
| `App.jsx` | Root React app. |
| `providers.jsx` | Tempat menyusun provider global, seperti auth dan toast. |
| `router.jsx` | Definisi route aplikasi. |
| `routeGuards.jsx` | Guard route untuk protected page dan role admin. |

### `frontend/src/components`

```text
components/
|-- common/
|-- kds/
|-- layout/
`-- pos/
```

| Folder | Fungsi |
| --- | --- |
| `common/` | Komponen UI reusable: `Button`, `Input`, `Select`, `Modal`, `Badge`, `DataTable`, `EmptyState`, `LoadingState`. |
| `layout/` | Layout utama aplikasi: `AppLayout`, `AuthLayout`, `CustomerLayout`, `Sidebar`, `Topbar`. |
| `pos/` | Komponen khusus POS/order, seperti cart, menu grid, invoice, dan badge status. |
| `kds/` | Komponen khusus Kitchen Display System. |

### `frontend/src/pages`

```text
pages/
|-- auth/
|-- categories/
|-- customer/
|-- dashboard/
|-- kds/
|-- menus/
|-- orders/
|-- reports/
|-- tables/
`-- users/
```

| Folder | Fungsi |
| --- | --- |
| `auth/` | Halaman login. |
| `dashboard/` | Dashboard ringkasan operasional. |
| `categories/` | CRUD kategori menu. |
| `menus/` | CRUD menu, upload gambar, filter, dan status aktif. |
| `tables/` | CRUD meja, status meja, QR token, dan copy link customer. |
| `orders/` | Order kasir, detail order, checkout, dan invoice. |
| `kds/` | Layar antrean dapur realtime. |
| `reports/` | Laporan penjualan dan menu terlaris. |
| `users/` | User management admin/kasir. |
| `customer/` | Public QR ordering dan status order customer. |

### `frontend/src/services`

Folder ini berisi adapter API per fitur.

| File | Fungsi |
| --- | --- |
| `authService.js` | Login, logout, dan `/me`. |
| `categoryService.js` | API kategori. |
| `menuService.js` | API menu dan upload gambar. |
| `tableService.js` | API meja, status, dan QR. |
| `orderService.js` | API order, invoice, checkout, dan update status. |
| `kdsService.js` | API antrean dapur dan update status item. |
| `reportService.js` | API laporan. |
| `userService.js` | API user management. |
| `customerService.js` | API publik untuk QR customer ordering. |

### `frontend/src/lib`

| File | Fungsi |
| --- | --- |
| `api.js` | Konfigurasi Axios, base URL, token auth, handler 401, helper response/error. |
| `echo.js` | Konfigurasi Laravel Echo/Reverb. |
| `storage.js` | Helper localStorage auth. |
| `currency.js` | Format Rupiah. |

### `frontend/src/contexts` dan `frontend/src/hooks`

| Folder | Fungsi |
| --- | --- |
| `contexts/` | State global React, seperti auth dan toast. |
| `hooks/` | Hook reusable, seperti `useAuth`, `useToast`, debounce, KDS realtime, dan customer order channel. |

### `frontend/src/config`

| File | Fungsi |
| --- | --- |
| `env.js` | Base URL API dan konfigurasi Reverb dari environment Vite. |
| `navigation.js` | Menu sidebar berdasarkan role user. |
| `tableStatuses.js` | Opsi status meja. |

### `frontend/src/styles`

| File | Fungsi |
| --- | --- |
| `index.css` | Entry CSS Tailwind dan global style dasar. |

## Docs

```text
docs/
|-- backend_implementation_guide.md
|-- frontend_implementation_guide.md
|-- folder_structure.md
`-- roadmap_be.md
```

| File | Fungsi |
| --- | --- |
| `backend_implementation_guide.md` | Guide implementasi backend. |
| `frontend_implementation_guide.md` | Guide implementasi frontend dan checklist fase. |
| `folder_structure.md` | Dokumen struktur folder project ini. |
| `roadmap_be.md` | Roadmap backend. |

## Pola Penempatan File Baru

Gunakan pola berikut saat menambah fitur:

| Kebutuhan | Lokasi |
| --- | --- |
| Endpoint API baru | `backend/routes/api.php` dan `backend/app/Http/Controllers/Api/` |
| Validasi request baru | `backend/app/Http/Requests/{Fitur}/` |
| Format response baru | `backend/app/Http/Resources/` |
| Logic bisnis kompleks | `backend/app/Actions/` atau `backend/app/Services/` |
| Model/tabel baru | `backend/app/Models/` dan `backend/database/migrations/` |
| Seeder/demo data baru | `backend/database/seeders/DatabaseSeeder.php` atau seeder terpisah |
| Page frontend baru | `frontend/src/pages/{fitur}/` |
| Komponen reusable | `frontend/src/components/common/` |
| Komponen fitur spesifik | `frontend/src/components/{fitur}/` |
| API client frontend | `frontend/src/services/{fitur}Service.js` |
| State global | `frontend/src/contexts/` dan hook di `frontend/src/hooks/` |
| Konfigurasi frontend | `frontend/src/config/` |

## Catatan Praktis

- Backend API default berjalan di `http://localhost:8000/api`.
- Frontend Vite default berjalan di `http://localhost:5173`.
- File upload menu disimpan di disk `public` Laravel.
- Public customer flow tidak membutuhkan login dan memakai route `/customer/tables/{qrToken}`.
- Admin/kasir flow membutuhkan token Sanctum dari endpoint `/api/login`.
- Realtime memakai Laravel Reverb dan Laravel Echo.
