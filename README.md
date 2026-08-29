# IT Helpdesk Ticket Analysis

Aplikasi full-stack untuk mengelola tiket dukungan IT, memantau SLA, menganalisis tren layanan, mengelola pegawai, serta mengimpor dan mengekspor data operasional.

> **Peringatan demo:** data, akun, dan kredensial demo tidak boleh digunakan di produksi. Ganti seluruh kata sandi, batasi CORS, dan gunakan basis data terpisah sebelum deployment nyata.

## Tangkapan layar

![Tampilan utama IT Helpdesk](frontend/src/assets/hero.png)

Repositori hanya menyertakan gambar di atas sebagai materi tampilan. Tidak ada tangkapan layar lain yang difabrikasi.

## Fitur

- Autentikasi berbasis cookie, CSRF, rate limiting, dan kontrol akses berbasis peran
- CRUD tiket, filter, pencarian, status, prioritas, serta kalkulasi SLA
- Dashboard analitik dengan rentang tanggal, tren, kategori, dan isu teratas
- Portal publik tervalidasi untuk pegawai
- Manajemen akun dan pegawai
- Impor CSV/XLSX dan ekspor laporan
- UI responsif, dialog aksesibel, status loading/error/kosong, dan route code splitting
- Log JSON terstruktur dengan request ID dan health check database

## Arsitektur

```text
Browser
  └─ React 18 + TypeScript + Vite + Zustand + Recharts
       └─ REST /api melalui cookie HttpOnly dan token CSRF
            └─ Express 5 + TypeScript
                 └─ Prisma 5
                      └─ PostgreSQL / Supabase
```

Frontend berada di `frontend/`, API di `backend/src/`, skema serta migrasi di `backend/prisma/`, dan CI di `.github/workflows/deno.yml`.

## Keamanan

- Cookie sesi, validasi CSRF untuk mutasi, Helmet, CORS allowlist, dan rate limiting
- Password di-hash dan otorisasi diperiksa di backend
- Logger tidak merekam body request dan meredaksi field password, token, secret, authorization, cookie, dan key
- Jangan commit `.env`, kredensial, dump database, atau token deployment
- Jalankan migrasi keamanan yang tersedia sebelum membuka aplikasi ke internet

## Persiapan lokal

Prasyarat: Node.js 20+, npm, dan PostgreSQL.

```bash
git clone <url-repositori>
cd it-helpdesk
cp backend/.env.example backend/.env
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Di terminal lain:

```bash
cd frontend
npm ci
npm run dev
```

Frontend menggunakan proxy Vite untuk pengembangan. Untuk lingkungan terpisah, isi `VITE_API_URL` dengan origin API beserta `/api`.

## Variabel lingkungan

Lihat `backend/.env.example` sebagai sumber utama. Variabel penting meliputi:

- `DATABASE_URL`: koneksi PostgreSQL untuk runtime
- `DIRECT_URL`: koneksi langsung untuk migrasi bila penyedia membutuhkannya
- `JWT_SECRET`: rahasia acak yang panjang dan unik
- `CORS_ORIGINS`: daftar origin frontend dipisahkan koma
- `TRUST_PROXY`: `true` saat berjalan di belakang proxy tepercaya
- `VITE_API_URL`: URL API untuk build frontend

## Migrasi dan data demo

```bash
cd backend
npx prisma migrate deploy
npm run prisma:seed
```

Seed hanya untuk demonstrasi. Tinjau isinya sebelum dijalankan dan jangan menjalankan seed demo pada database produksi.

## Pengujian dan build

```bash
cd backend
npm test
npm run build

cd ../frontend
npm run build
```

Frontend belum menjalankan lint di CI karena repositori belum memiliki konfigurasi ESLint lengkap. TypeScript tetap diperiksa oleh `npm run build`.

## Deployment Vercel

Deploy `backend/` dan `frontend/` sebagai dua proyek Vercel. Atur seluruh env backend di proyek API, `VITE_API_URL` di proyek frontend, serta `CORS_ORIGINS` sesuai domain frontend. Jalankan `npx prisma migrate deploy` terhadap database produksi sebelum mengalihkan trafik. File `vercel.json` pada masing-masing aplikasi menangani routing serverless dan SPA.

## Keputusan teknis

- React/Vite mempertahankan shell dan login secara eager; halaman route dimuat lazy untuk mengecilkan bundle awal.
- Express middleware menghasilkan request ID dan satu log JSON per request tanpa dependency observability tambahan.
- Filter tanggal diterapkan pada query analytics di backend agar semua grafik memakai populasi data konsisten.
- Prisma menjadi satu-satunya akses database untuk menjaga tipe dan migrasi tetap sinkron.

## Observability

Vercel menangkap `stdout` dan `stderr`; setiap request menghasilkan JSON dengan `requestId`, `method`, `path`, `status`, dan `durationMs`. Buka proyek backend di Vercel, pilih **Logs**, lalu cari berdasarkan `requestId` yang juga dikembalikan pada header `x-request-id` dan respons error.

Untuk uptime monitoring, gunakan monitor HTTP pilihan organisasi pada endpoint `GET /api/health`, interval sekitar lima menit, ekspektasi status 200, dan alert setelah dua atau tiga kegagalan berurutan. Tidak diperlukan penyedia berbayar; layanan gratis atau sistem internal dapat digunakan. Respons 503 menandakan koneksi database gagal dan menghasilkan event `health_database_failure` di log.

## Pemecahan masalah

- **401 berulang:** periksa cookie, HTTPS, domain, waktu sistem, dan konfigurasi CORS.
- **403 pada mutasi:** muat ulang sesi agar token CSRF diperbarui dan pastikan peran memiliki izin.
- **Health 503:** verifikasi `DATABASE_URL`, pooler, allowlist jaringan, dan status PostgreSQL.
- **Prisma gagal build:** jalankan `npx prisma generate`, lalu pastikan versi Node dan lockfile digunakan.
- **Frontend tidak menemukan API:** periksa `VITE_API_URL`, rewrite Vercel, dan `CORS_ORIGINS`.
- **Analitik kosong:** hapus rentang tanggal atau pastikan `dateFrom` tidak melewati `dateTo`.
