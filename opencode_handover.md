# 🚀 Project Handover Document (IT Helpdesk)

Dokumen ini dibuat khusus untuk memberikan konteks (informasi latar belakang) kepada AI / Developer lain (seperti OpenCode) agar bisa langsung memahami struktur, teknologi, dan status terakhir dari project IT Helpdesk ini.

---

## 1. Project Overview
Aplikasi **IT Helpdesk Organisasi** adalah platform berbasis web full-stack yang digunakan untuk melacak, mengelola, dan menyelesaikan keluhan IT (Trouble Tickets) dari pegawai. Aplikasi ini mendukung fitur SLA (Service Level Agreement), Dashboard Analitik, Multi-Role (Admin, IT Support, Manager), dan ekspor data ke Excel (dioptimasi untuk Google Looker Studio).

## 2. Tech Stack (Teknologi yang Digunakan)
*   **Frontend:** React.js, Vite, TypeScript, Tailwind CSS, Zustand (State Management), Axios (API Client), Recharts/Chart.js (Grafik).
*   **Backend:** Node.js, Express.js, TypeScript, Prisma ORM, JWT (JSON Web Token) untuk Autentikasi.
*   **Database:** PostgreSQL (dihosting di Supabase).
*   **Deployment:** 
    *   **Backend:** Dikonfigurasi untuk berjalan sebagai Serverless Function di **Vercel** (menggunakan file `backend/vercel.json`).
    *   **Frontend:** Di-deploy di **Vercel**.
    *   *(Terdapat juga opsi alternatif menggunakan Render.com untuk backend).*

---

## 3. Struktur Folder Utama (Project Tree)
Project ini menggunakan konsep *Monorepo* dengan pembagian `frontend` dan `backend` yang jelas.

```text
web_helpdesk-organisasi/
│
├── backend/                  # REST API Server
│   ├── prisma/               # Schema Database (schema.prisma) & Script Seed
│   ├── src/                  
│   │   ├── controllers/      # Logika Bisnis (Tiket, Auth, Report, dll)
│   │   ├── middleware/       # Autentikasi JWT & Error Handler
│   │   ├── routes/           # Endpoint API (Express Router)
│   │   ├── utils/            # Fungsi bantuan (Kalkulasi SLA, Logger)
│   │   └── app.ts            # Konfigurasi Utama Express
│   ├── vercel.json           # Konfigurasi Serverless Vercel
│   └── supabase_init.sql     # Raw SQL untuk inisialisasi Database
│
└── frontend/                 # React UI
    ├── src/
    │   ├── components/       # Komponen UI (Modal, Tabel, Sidebar, Form)
    │   ├── pages/            # Halaman Web (Dashboard, Kelola Tiket, dll)
    │   ├── services/         # Konfigurasi Axios & Panggilan API
    │   ├── store/            # Zustand Store (authStore.ts)
    │   ├── types/            # Definisi TypeScript Interface
    │   └── index.css         # Tailwind directives & CSS Variables (Theme)
    └── vite.config.ts        # Konfigurasi Vite
```

---

## 4. Status Terakhir & Pekerjaan yang Telah Diselesaikan
✅ **Fitur Inti:** Autentikasi (Login/Logout/Ubah Password), Manajemen Tiket (CRUD, Status, Prioritas), Manajemen User/Pegawai, Notifikasi, Log Aktivitas.
✅ **UI/UX:** Desain modern dengan dukungan penuh fitur berganti warna (*Dark Mode* & *Light Mode*) yang diatur menggunakan variabel CSS (contoh: `bg-background`, `text-foreground`).
✅ **Export & Report:** Fitur Export Excel sudah diperbaiki formatnya (kolom terpisah dengan format ISO Date `YYYY-MM-DD HH:mm:ss`) agar data bisa **langsung dibaca oleh Google Looker Studio**.
✅ **Deployment Readiness:** 
*   Kodingan backend sudah diubah agar kompatibel dengan Vercel Serverless (menghindari error `req.ip` dan tipe data TypeScript di Express versi terbaru).
*   File `vite-env.d.ts` sudah ditambahkan di Frontend untuk mencegah error build Vercel `import.meta.env`.
*   Skema database dibuat secara aman menggunakan metode `supabase_init.sql` (Raw SQL) untuk menghindari pemblokiran jaringan IPv6 saat proses push schema.

---

## 5. Next Steps (Fitur yang Belum Dikerjakan / Tertunda)
Jika Anda (OpenCode) akan melanjutkan project ini, ini adalah daftar fitur yang direncanakan namun belum dieksekusi:

1.  **Google Looker Studio Integration (Priority 1):** 
    Menyusun panduan atau sistem *pipeline* untuk mengkoneksikan file Excel yang diekspor dari aplikasi ini ke Google Looker Studio untuk pembuatan Dashboard Eksternal.
2.  **File Attachments (Lampiran):** 
    Menambahkan fitur upload gambar/file pada form pembuatan tiket dan komentar menggunakan Supabase Storage atau Multer.
3.  **Email Notifications:** 
    Mengintegrasikan layanan seperti Resend, SendGrid, atau Nodemailer agar setiap perubahan status tiket akan mengirimkan email ke pelapor.
4.  **Knowledge Base (FAQ):** 
    Membuat modul baru agar Admin bisa menulis artikel solusi, dan Pelapor (User) bisa mencari solusi mandiri sebelum membuat tiket baru.
5.  **Internal Notes:** 
    Fitur bagi IT Support untuk meninggalkan "Komentar Internal" di dalam tiket yang hanya bisa dibaca oleh sesama teknisi (tidak terlihat oleh pelapor).

---

## 6. Catatan Teknis Penting untuk Developer
*   **Environment Variables:** 
    *   Backend membutuhkan: `DATABASE_URL` (koneksi PostgreSQL), `JWT_SECRET` (rahasia token), `PORT` (default 5000).
    *   Frontend membutuhkan: `VITE_API_URL` (URL API Backend).
*   **Database Schema:** Relasi utamanya adalah Tiket -> Pegawai (Pelapor) -> Kategori/Subkategori -> Teknisi (User). Detailnya bisa dilihat di `backend/prisma/schema.prisma`.
*   **Styling:** Kami menghindari *hardcoded colors* (seperti `bg-white` atau `text-gray-900`) untuk elemen utama. Gunakan utility class Semantic dari Tailwind seperti `bg-card`, `text-foreground`, `border-border` agar mode gelap/terang tidak rusak.

---
*(Dokumen dibuat oleh: Antigravity AI - Google DeepMind)*
