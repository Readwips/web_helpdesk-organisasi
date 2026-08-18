# IT Helpdesk Ticket Analysis

**IT Helpdesk Ticket Analysis** adalah aplikasi web portfolio untuk mengelola tiket IT Support, menganalisis data, dan memonitoring SLA.

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 5 |

## Cara Menjalankan

### Prasyarat
- Node.js v20.x
- PostgreSQL 15/16 terinstall dan berjalan
- npm

### 1. Setup Database

Pastikan PostgreSQL berjalan, lalu buat database:

```sql
CREATE DATABASE it_helpdesk;
```

Atau gunakan psql:
```bash
psql -U postgres -c "CREATE DATABASE it_helpdesk;"
```

### 2. Setup Backend

```bash
cd backend

# Salin dan edit .env
copy .env.example .env
# Edit DATABASE_URL jika password berbeda dari "postgres123"

# Jalankan migrasi database
npx prisma migrate dev --name init

# Seed data dummy (1200 tiket)
npx ts-node prisma/seed.ts

# Jalankan server
npm run dev
```

Backend berjalan di: http://localhost:5000

### 3. Setup Frontend

```bash
cd frontend

# Jalankan dev server
npm run dev
```

Frontend berjalan di: http://localhost:5173

### 4. Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ithelpdesk.id | password123 |
| IT Support | andi@ithelpdesk.id | password123 |
| Manager | manager@ithelpdesk.id | password123 |

## Fitur (Phase 1 — Selesai)
- [x] Authentication (login/logout, JWT)
- [x] Dashboard dengan KPI cards
- [x] Tren tiket (line chart)
- [x] Distribusi kategori (donut chart)
- [x] Top 5 keluhan (bar chart)
- [x] Daftar tiket SLA breached
- [x] Database schema + seed 1200 tiket
- [x] Sidebar navigation
- [x] Responsive layout (desktop priority)

## Roadmap Phase Berikutnya
- Phase 2: Kelola Tiket (CRUD + filter + pagination)
- Phase 3: Kepatuhan SLA
- Phase 4: Analytics lengkap
- Phase 5: Import CSV/Excel + Export laporan
- Phase 6: Polish + responsive
