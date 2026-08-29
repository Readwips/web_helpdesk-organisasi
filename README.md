# 🚀 IT Helpdesk Ticket Analysis

**IT Helpdesk Ticket Analysis** adalah aplikasi web *full-stack* untuk mengelola tiket IT Support, menganalisis data, memonitor kepatuhan SLA (Service Level Agreement), dan mengekspor laporan dalam bentuk Excel.

---

## 🔗 Live Demo Links

* 🖥️ **Frontend (Aplikasi Web):** [https://web-helpdesk-frontend.vercel.app](https://web-helpdesk-frontend.vercel.app)
* 🎫 **Portal Tiket Pegawai (Public):** [https://web-helpdesk-frontend.vercel.app/portal](https://web-helpdesk-frontend.vercel.app/portal)
* ⚙️ **Backend API (Health Check):** [https://web-helpdesk-organisasi.vercel.app/api/health](https://web-helpdesk-organisasi.vercel.app/api/health)

### 🔐 Demo Akun Login (Admin/Staff)

Silakan gunakan kredensial berikut untuk masuk ke dalam *dashboard* utama:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@ithelpdesk.id` | `password123` |
| **IT Support** | `andi@ithelpdesk.id` | `password123` |
| **IT Support** | `budi@ithelpdesk.id` | `password123` |
| **IT Support** | `citra@ithelpdesk.id` | `password123` |
| **IT Support** | `dimas@ithelpdesk.id` | `password123` |
| **IT Support** | `eka@ithelpdesk.id` | `password123` |
| **Manager** | `manager@ithelpdesk.id` | `password123` |

> Kredensial di atas hanya untuk demonstrasi dan tidak boleh digunakan pada sistem produksi.

### 🎫 Akun Portal (Untuk Buat Tiket)

Untuk mengetes pembuatan tiket dari sisi pegawai (tanpa login), gunakan **Nomor Pegawai** berikut di halaman Portal:

* `001`, `002`, `003`, hingga `007`.

---

## 🛠️ Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS 3 (Full Dark Mode Support) |
| **State Management** | Zustand |
| **Backend** | Node.js, Express, TypeScript (Serverless Ready) |
| **Database** | PostgreSQL (Supabase) + Transaction Pooler |
| **ORM** | Prisma 5 |
| **Deployment** | Vercel (Frontend & Backend) |

---

## ✨ Fitur Utama

- [x] **Authentication & Role-Based Access** (Admin, Manager, Staff).
- [x] **Manajemen Tiket (CRUD)** dengan status penyelesaian dan filter.
- [x] **Kepatuhan SLA (Service Level Agreement)** otomatis berdasarkan tingkat prioritas.
- [x] **Analytics & Dashboard Interaktif** menggunakan *Recharts*.
- [x] **Portal Pegawai Publik** dengan validasi nomor kepegawaian.
- [x] **Export/Import Excel (XLSX)** dengan format ISO 8601.
- [x] **Dark/Light Mode Theme** terintegrasi menggunakan *CSS Variables*.
- [x] **Database Seeding** dengan data tiket simulasi untuk demo analitik.

---
