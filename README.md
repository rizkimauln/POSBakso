# POS Bakso

Monorepo untuk aplikasi POS Warung Bakso.

```text
backend/   Laravel API, Sanctum, Reverb, MySQL
frontend/  React.js, Vite, Tailwind CSS
docs/      Roadmap dan dokumentasi teknis
```

## Requirement

Siapkan:

- PHP 8.3+
- Composer
- MySQL atau MariaDB
- Node.js 20+
- npm
- Laragon/XAMPP atau local server sejenis

## Setup Backend

Masuk ke folder backend:

```bash
cd backend
```

Install dependency:

```bash
composer install
```

Salin env:

```bash
copy .env.example .env
```

Generate app key:

```bash
php artisan key:generate
```

Atur database di `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=warung_bakso_db
DB_USERNAME=root
DB_PASSWORD=
```

Jalankan migration dan seeder:

```bash
php artisan migrate --seed
```

Buat storage link:

```bash
php artisan storage:link
```

Jalankan API:

```bash
php artisan serve
```

Jalankan Reverb di terminal lain:

```bash
php artisan reverb:start
```

## Akun Default

Seeder membuat akun:

```text
admin@posbakso.test / password
kasir@posbakso.test / password
```

Role:

```text
admin = manajemen sistem, laporan, user, master data
kasir = operasional order, KDS, checkout, invoice
```

## Setup Frontend

Masuk ke folder frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Salin env:

```bash
copy .env.example .env
```

Isi `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_BROADCAST_AUTH_URL=http://localhost:8000/broadcasting/auth

VITE_REVERB_APP_KEY=isi_dari_backend_env
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

`VITE_REVERB_APP_KEY` ambil dari `backend/.env`:

```env
REVERB_APP_KEY=...
```

Jalankan frontend:

```bash
npm run dev
```

## Command Development

Backend API:

```bash
cd backend
php artisan serve
```

Reverb:

```bash
cd backend
php artisan reverb:start
```

Frontend:

```bash
cd frontend
npm run dev
```

## Testing dan Build

Backend:

```bash
cd backend
php artisan test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Realtime Reverb

Admin/kasir listen channel:

```text
private-kds.orders
```

Customer listen channel:

```text
orders.{public_token}
```

Event:

```text
.order.created
.order.status.updated
.order.item.status.updated
.order.completed
```

## Dokumentasi

Lihat:

```text
docs/backend_implementation_guide.md
docs/frontend_implementation_guide.md
```
