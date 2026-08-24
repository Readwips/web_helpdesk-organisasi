# 🚀 IT Helpdesk Ticket Analysis

**IT Helpdesk Ticket Analysis** adalah aplikasi web portfolio *full-stack* tingkat produksi untuk mengelola tiket IT Support, menganalisis data secara *real-time*, memonitoring kepatuhan SLA (Service Level Agreement), dan mengekspor laporan eksternal ke Google Looker Studio.

Aplikasi ini telah di-deploy ke Cloud dan dapat diakses langsung tanpa perlu instalasi.

---

## 🔗 Live Demo Links

*   🖥️ **Frontend (Aplikasi Web):** [https://web-helpdesk-frontend.vercel.app](https://web-helpdesk-frontend.vercel.app)
*   🎫 **Portal Tiket Pegawai (Public):** [https://web-helpdesk-frontend.vercel.app/portal](https://web-helpdesk-frontend.vercel.app/portal)
*   ⚙️ **Backend API (Health Check):** [https://web-helpdesk-organisasi.vercel.app/api/health](https://web-helpdesk-organisasi.vercel.app/api/health)

### 🔐 Demo Akun Login (Admin/Staff)
Silakan gunakan kredensial berikut untuk masuk ke dalam *dashboard* utama:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@ithelpdesk.id` | `password123` |
| **IT Support** | `andi@ithelpdesk.id` | `password123` |
| **Manager** | `manager@ithelpdesk.id` | `password123` |

### 🎫 Akun Portal (Untuk Buat Tiket)
Untuk mengetes pembuatan tiket dari sisi pegawai (tanpa login), gunakan **Nomor Pegawai** berikut di halaman Portal:
*   `001`, `002`, `003`, hingga `007`.

---

## 🛠️ Stack Teknologi Terkini

Aplikasi ini menggunakan teknologi modern yang sangat skalabel:

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS 3 (Full Dark Mode Support) |
| **State Management**| Zustand |
| **Backend** | Node.js, Express, TypeScript (Serverless Ready) |
| **Database** | PostgreSQL (Supabase) + Transaction Pooler |
| **ORM** | Prisma 5 |
| **Deployment** | Vercel (Front & Back) |

---

## ✨ Fitur Utama (Selesai)

Aplikasi ini telah menyelesaikan semua fase pengembangannya:
- [x] **Authentication & Role-Based Access** (Admin, Manager, Staff).
- [x] **Manajemen Tiket (CRUD)** dengan status penyelesaian dan filter.
- [x] **Kepatuhan SLA (Service Level Agreement)** otomatis berdasarkan tingkat prioritas.
- [x] **Analytics & Dashboard Interaktif** menggunakan *Recharts* (Tren waktu, metrik SLA, distribusi kategori).
- [x] **Portal Pegawai Publik** dengan validasi nomor kepegawaian.
- [x] **Export/Import Excel (XLSX)** dengan format ISO 8601 yang dioptimasi khusus untuk *Google Looker Studio*.
- [x] **Dark/Light Mode Theme** terintegrasi menggunakan *CSS Variables*.
- [x] **Database Seeding** dengan 1.200 data tiket simulasi untuk keperluan demo analitik.

---

*(Readme ini telah diperbarui untuk mencerminkan status proyek yang sudah Live Deployment di Vercel).*
