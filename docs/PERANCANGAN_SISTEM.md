# Perancangan Sistem POS Bakso Nusantara

## 1. Ruang Lingkup

Dokumen ini menjelaskan rancangan proses dan basis data untuk aplikasi POS Bakso Nusantara. Sistem mendukung:

- Pemesanan mandiri pelanggan melalui QR code pada meja.
- Pemantauan pesanan masuk secara realtime oleh kasir.
- Pemrosesan pesanan dan pembayaran tunai atau QRIS.
- Pengelolaan kategori, menu, meja, pengguna, dan laporan oleh admin.

## 2. Aktor Sistem

| Aktor | Tanggung Jawab |
| --- | --- |
| Pelanggan | Memindai QR meja, memilih menu, mengirim pesanan, dan memantau status pesanan. |
| Kasir | Menerima notifikasi pesanan, memproses pesanan, menerima pembayaran, dan mencetak invoice. |
| Admin | Mengelola master data, akun pengguna, status meja, serta melihat laporan penjualan. |
| Sistem | Memvalidasi data, menyimpan transaksi, menghitung total, dan mengirim pembaruan realtime. |

## 3. Activity Diagram

### 3.1 Pemesanan Pelanggan dari QR Meja

```mermaid
flowchart TD
    subgraph Pelanggan
        A([Mulai]) --> B[Memindai QR code meja]
        D[Melihat daftar menu aktif]
        E[Mencari dan memilih menu]
        F[Menentukan jumlah dan catatan pesanan]
        G[Mengisi nama pelanggan]
        H[Menekan tombol Kirim Order]
        N[Melihat nomor dan status pesanan]
        O([Selesai])
    end

    subgraph Sistem
        C{QR token meja valid?}
        C1[Tampilkan pesan QR tidak valid]
        I{Data pesanan valid?}
        I1[Tampilkan pesan validasi]
        J[Simpan order dan detail item]
        K[Hitung total pesanan]
        L[Ubah status meja menjadi terisi]
        M[Kirim notifikasi realtime order baru]
    end

    B --> C
    C -- Tidak --> C1 --> O
    C -- Ya --> D
    D --> E --> F --> G --> H --> I
    I -- Tidak --> I1 --> E
    I -- Ya --> J --> K --> L --> M --> N --> O
```

### 3.2 Pemrosesan Pesanan oleh Kasir

```mermaid
flowchart TD
    subgraph Sistem
        A([Order pelanggan tersimpan]) --> B[Kirim notifikasi realtime]
        D[Tampilkan detail order dan meja]
        G[Simpan perubahan status order]
        H[Kirim pembaruan status realtime]
    end

    subgraph Kasir
        C[Menerima notifikasi pesanan masuk]
        E[Membuka detail pesanan]
        F{Aksi kasir}
        F1[Ubah status menjadi diproses]
        F2[Ubah status menjadi selesai]
        I([Pesanan siap dibayar])
    end

    B --> C --> D --> E --> F
    F -- Mulai dikerjakan --> F1 --> G
    F -- Selesai dibuat --> F2 --> G
    G --> H --> I
```

### 3.3 Pembayaran Pesanan

```mermaid
flowchart TD
    subgraph Kasir
        A([Mulai pembayaran]) --> B[Membuka detail pesanan]
        C[Memilih metode pembayaran]
        E[Memasukkan uang diterima]
        K[Mencetak atau melihat invoice]
        L([Selesai])
    end

    subgraph Sistem
        D{Metode pembayaran}
        F{Uang tunai mencukupi?}
        F1[Tampilkan pesan uang tidak mencukupi]
        G[Hitung uang kembalian]
        H[Simpan pembayaran]
        I[Ubah status pembayaran menjadi lunas]
        J[Ubah status meja menjadi kosong dan kirim pembaruan realtime]
    end

    B --> C --> D
    D -- Tunai --> E --> F
    F -- Tidak --> F1 --> E
    F -- Ya --> G --> H
    D -- QRIS --> H
    H --> I --> J --> K --> L
```

### 3.4 Pengelolaan Data oleh Admin

```mermaid
flowchart TD
    A([Mulai]) --> B[Admin login]
    B --> C{Kredensial valid?}
    C -- Tidak --> D[Tampilkan pesan login gagal] --> B
    C -- Ya --> E[Tampilkan dashboard admin]
    E --> F{Pilih menu pengelolaan}
    F -- Kategori --> G[Kelola kategori menu]
    F -- Menu --> H[Kelola menu dan ketersediaan]
    F -- Meja --> I[Kelola status meja dan QR token]
    F -- Pengguna --> J[Kelola akun admin atau kasir]
    F -- Laporan --> K[Lihat laporan harian, penjualan, dan menu terlaris]
    G --> L[Simpan perubahan]
    H --> L
    I --> L
    J --> L
    K --> M{Lanjutkan aktivitas?}
    L --> M
    M -- Ya --> E
    M -- Tidak --> N[Logout] --> O([Selesai])
```

### 3.5 Alur Utama Terintegrasi

```mermaid
flowchart LR
    A[Pelanggan scan QR meja] --> B[Pelanggan memilih menu]
    B --> C[Pelanggan mengirim pesanan]
    C --> D[Sistem menyimpan order]
    D --> E[Sistem mengirim notifikasi realtime]
    E --> F[Kasir menerima pesanan]
    F --> G[Kasir memproses pesanan]
    G --> H[Sistem memperbarui status]
    H --> I[Pelanggan melihat status terbaru]
    G --> J[Kasir menyelesaikan pembayaran]
    J --> K[Sistem mencatat transaksi dan mengosongkan meja]
    K --> L[Data masuk ke laporan penjualan]
```

## 4. Perancangan Basis Data

### 4.1 ERD Utama

```mermaid
erDiagram
    USERS o|--o{ ORDERS : "memproses"
    TABLES ||--o{ ORDERS : "memiliki"
    CATEGORIES ||--o{ MENUS : "mengelompokkan"
    ORDERS ||--|{ ORDER_ITEMS : "terdiri dari"
    MENUS ||--o{ ORDER_ITEMS : "dipilih sebagai"

    USERS {
        bigint id PK
        varchar name
        varchar email UK
        timestamp email_verified_at "nullable"
        varchar password
        enum role "admin atau kasir"
        varchar remember_token "nullable"
        timestamp created_at
        timestamp updated_at
    }

    TABLES {
        bigint id PK
        varchar table_number UK
        varchar qr_token UK
        enum status "kosong, terisi, menunggu_bayar"
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        bigint id PK
        varchar name
        timestamp created_at
        timestamp updated_at
    }

    MENUS {
        bigint id PK
        bigint category_id FK
        varchar name
        text description "nullable"
        integer price
        varchar image_path "nullable"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ORDERS {
        bigint id PK
        varchar public_token UK
        bigint table_id FK
        bigint user_id FK "nullable"
        varchar customer_name
        integer total_amount
        integer cash_amount "nullable"
        integer change_amount "nullable"
        enum order_status "pending, diproses, selesai"
        enum payment_method "tunai atau qris, nullable"
        enum payment_status "lunas atau belum_lunas"
        timestamp created_at
        timestamp updated_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint menu_id FK
        integer quantity
        integer price "harga saat transaksi"
        text notes "nullable"
        timestamp created_at
        timestamp updated_at
    }
```

### 4.2 Penjelasan Relasi

| Relasi | Kardinalitas | Penjelasan |
| --- | --- | --- |
| `categories` ke `menus` | Satu ke banyak | Satu kategori dapat berisi banyak menu. Setiap menu wajib berada dalam satu kategori. |
| `tables` ke `orders` | Satu ke banyak | Satu meja dapat memiliki banyak riwayat order. Setiap order berasal dari tepat satu meja. |
| `users` ke `orders` | Nol atau satu ke banyak | Satu kasir dapat memproses banyak order. Order dari QR pelanggan dapat dibuat sebelum memiliki kasir sehingga `user_id` bersifat opsional. |
| `orders` ke `order_items` | Satu ke banyak | Satu order wajib memiliki minimal satu detail item. |
| `menus` ke `order_items` | Satu ke banyak | Satu menu dapat muncul pada banyak detail transaksi. |

### 4.3 Kamus Data

#### Tabel `users`

| Kolom | Tipe | Aturan | Keterangan |
| --- | --- | --- | --- |
| `id` | `bigint` | Primary key | Identitas pengguna. |
| `name` | `varchar` | Wajib | Nama admin atau kasir. |
| `email` | `varchar` | Wajib, unik | Email untuk login. |
| `password` | `varchar` | Wajib | Password yang telah di-hash. |
| `role` | `enum` | `admin`, `kasir` | Hak akses pengguna. |

#### Tabel `categories`

| Kolom | Tipe | Aturan | Keterangan |
| --- | --- | --- | --- |
| `id` | `bigint` | Primary key | Identitas kategori. |
| `name` | `varchar` | Wajib | Nama kategori, misalnya bakso atau minuman. |

#### Tabel `tables`

| Kolom | Tipe | Aturan | Keterangan |
| --- | --- | --- | --- |
| `id` | `bigint` | Primary key | Identitas meja. |
| `table_number` | `varchar` | Wajib, unik | Nomor atau kode meja. |
| `qr_token` | `varchar` | Wajib, unik | Token QR untuk membuka menu pelanggan. |
| `status` | `enum` | `kosong`, `terisi`, `menunggu_bayar` | Kondisi meja saat ini. |

#### Tabel `menus`

| Kolom | Tipe | Aturan | Keterangan |
| --- | --- | --- | --- |
| `id` | `bigint` | Primary key | Identitas menu. |
| `category_id` | `bigint` | Foreign key | Kategori menu. |
| `name` | `varchar` | Wajib | Nama menu. |
| `description` | `text` | Opsional | Deskripsi menu. |
| `price` | `integer` | Wajib | Harga menu dalam rupiah. |
| `image_path` | `varchar` | Opsional | Lokasi gambar menu. |
| `is_active` | `boolean` | Default `true` | Menentukan apakah menu dapat dipesan. |

#### Tabel `orders`

| Kolom | Tipe | Aturan | Keterangan |
| --- | --- | --- | --- |
| `id` | `bigint` | Primary key | Identitas transaksi internal. |
| `public_token` | `varchar(64)` | Wajib, unik | Token publik untuk memantau pesanan pelanggan tanpa login. |
| `table_id` | `bigint` | Foreign key | Meja asal pesanan. |
| `user_id` | `bigint` | Foreign key, opsional | Kasir yang menangani transaksi. |
| `customer_name` | `varchar` | Wajib | Nama pelanggan pemesan. |
| `total_amount` | `integer` | Default `0` | Total nilai pesanan dalam rupiah. |
| `cash_amount` | `integer` | Opsional | Uang tunai yang diterima. |
| `change_amount` | `integer` | Opsional | Uang kembalian pelanggan. |
| `order_status` | `enum` | `pending`, `diproses`, `selesai` | Tahap pengerjaan pesanan. |
| `payment_method` | `enum` | `tunai`, `qris`, opsional | Metode pembayaran yang dipilih. |
| `payment_status` | `enum` | `lunas`, `belum_lunas` | Status pelunasan transaksi. |

#### Tabel `order_items`

| Kolom | Tipe | Aturan | Keterangan |
| --- | --- | --- | --- |
| `id` | `bigint` | Primary key | Identitas detail pesanan. |
| `order_id` | `bigint` | Foreign key | Transaksi induk. |
| `menu_id` | `bigint` | Foreign key | Menu yang dipesan. |
| `quantity` | `integer` | Wajib | Jumlah menu yang dipesan. |
| `price` | `integer` | Wajib | Salinan harga menu saat transaksi dibuat. |
| `notes` | `text` | Opsional | Catatan khusus pelanggan. |

Semua tabel utama memiliki `created_at` dan `updated_at` untuk mencatat waktu pembuatan serta perubahan data.

### 4.4 Tabel Pendukung Teknis

Selain tabel bisnis utama, aplikasi menggunakan tabel bawaan Laravel:

| Tabel | Fungsi |
| --- | --- |
| `personal_access_tokens` | Menyimpan token autentikasi API Laravel Sanctum. |
| `password_reset_tokens` | Mendukung pemulihan password pengguna. |
| `sessions` | Menyimpan sesi aplikasi jika session driver menggunakan database. |
| `cache`, `cache_locks` | Menyimpan cache dan lock aplikasi. |
| `jobs`, `job_batches`, `failed_jobs` | Mendukung pemrosesan antrean pekerjaan Laravel. |

### 4.5 Aturan Bisnis Penting

1. Pelanggan hanya dapat membuka menu melalui `qr_token` meja yang valid.
2. Pelanggan hanya dapat memesan menu dengan `is_active = true`.
3. Setiap order memiliki minimal satu `order_item`.
4. Nilai `order_items.price` menyimpan harga saat transaksi agar histori tetap benar walaupun harga menu berubah.
5. `orders.total_amount` dihitung dari jumlah `quantity * price` seluruh detail pesanan.
6. Pembayaran tunai hanya dapat diselesaikan jika uang diterima mencukupi total transaksi.
7. Setelah pembayaran selesai, `payment_status` menjadi `lunas` dan meja dapat digunakan kembali.
8. Perubahan order dikirim secara realtime agar pelanggan, kasir, dan admin memperoleh status terbaru tanpa refresh manual.

### 4.6 Normalisasi Basis Data

Struktur basis data telah menerapkan prinsip normalisasi hingga Third Normal Form (3NF):

1. Setiap tabel memiliki primary key dan menyimpan data atomik.
2. Data kategori, menu, meja, transaksi, dan detail transaksi dipisahkan sesuai tanggung jawabnya.
3. Informasi yang berulang dihubungkan dengan foreign key.
4. Harga pada `order_items` sengaja disimpan sebagai snapshot transaksi, bukan duplikasi yang perlu mengikuti perubahan harga menu.

