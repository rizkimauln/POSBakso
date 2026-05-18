# Frontend POS Bakso

Frontend React untuk POS Warung Bakso.

## Stackk

- React.js
- Vite
- Tailwind CSS
- Axios
- React Router
- Laravel Echo
- Pusher JS untuk koneksi Reverb
- Lucide React untuk icon

## Setup

Install dependency:

```bash
npm install
```

Salin env:

```bash
copy .env.example .env
```

Isi `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_BROADCAST_AUTH_URL=http://localhost:8000/broadcasting/auth
VITE_REVERB_APP_KEY=isi_dari_backend_env
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Jalankan development server:

```bash
npm run dev
```

## Script

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Catatan

Pastikan backend Laravel dan Reverb aktif:

```bash
cd ../backend
php artisan serve
php artisan reverb:start
```
