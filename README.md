# LohParkir 🅿️
### Sistem Validasi Parkir Resmi Kota Medan
**Dinas Perhubungan Kota Medan**

---

## Gambaran Umum

LohParkir adalah sistem manajemen dan validasi parkir berbasis QR Code yang dikelola oleh Dinas Perhubungan Kota Medan. Sistem ini memastikan masyarakat dapat memverifikasi keaslian petugas parkir dan membayar parkir secara digital dengan aman.

### Platform
| Platform | Teknologi | Direktori |
|---|---|---|
| 🌐 Admin Dashboard | Next.js + TypeScript + Tailwind | `admin-dashboard/` |
| 📱 Mobile App | React Native + Expo | `mobile/` |
| ⚙️ Backend API | Node.js + Express + TypeScript | `backend/` |
| 🗄️ Database | PostgreSQL | `database/` |

---

## Cara Menjalankan

### Prasyarat
- Node.js 18+
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`)

### 1. Setup Database

```bash
# Buat database PostgreSQL
psql -U postgres -c "CREATE DATABASE lohparkir;"

# Jalankan migration
psql -U postgres -d lohparkir -f database/migrations/001_init.sql

# Jalankan seed data
psql -U postgres -d lohparkir -f database/seeds/001_seed.sql
```

### 2. Backend API

```bash
cd backend

# Salin file environment
copy .env.example .env
# Edit .env sesuai konfigurasi Anda (DB_PASSWORD, JWT_SECRET, ENCRYPTION_KEY)

# Install dependencies
npm install

# Jalankan development server
npm run dev
# Server berjalan di: http://localhost:3001
```

### 3. Admin Dashboard

```bash
cd admin-dashboard

# Install (sudah dilakukan)
# npm install

# Jalankan development server
npm run dev
# Dashboard berjalan di: http://localhost:3000
```

### 4. Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Jalankan Expo
npx expo start

# Scan QR code dengan Expo Go (Android/iOS)
# atau tekan 'a' untuk Android emulator
```

---

## Akun Default (Seed Data)

| Role | Email | Password |
|---|---|---|
| Superadmin | superadmin@lohparkir.id | LohParkir@2024 |
| Admin Dishub | admin1@dishubmedan.id | LohParkir@2024 |
| Admin Dishub | admin2@dishubmedan.id | LohParkir@2024 |

---

## Format QR Code Resmi

```
LOHPARKIR-DSH-YYYY-NNN
Contoh: LOHPARKIR-DSH-2024-001
```

---

## API Endpoints

Dokumentasi API lengkap tersedia di: [docs/api.md](docs/api.md)

**Base URL:** `http://localhost:3001/api/v1`

**Endpoint utama:**
- `POST /auth/login` — Login
- `POST /qr/validate` — Validasi QR Code (public)
- `POST /reports` — Submit laporan (public)
- `GET /dashboard/stats` — Statistik real-time
- `GET /dashboard/public` — Statistik publik

---

## Struktur Proyek

```
LohParkir/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, env, websocket
│   │   ├── middleware/       # Auth JWT, rate limiter, error handler
│   │   ├── routes/           # API endpoints (9 route files)
│   │   └── services/         # QR, payment, notification, audit
│   ├── package.json
│   └── .env.example
├── admin-dashboard/
│   ├── src/app/
│   │   ├── login/            # Halaman login
│   │   ├── dashboard/        # Layout + semua halaman admin
│   │   │   ├── officers/     # Manajemen petugas
│   │   │   ├── reports/      # Manajemen laporan
│   │   │   ├── zones/        # Zona parkir
│   │   │   ├── transactions/ # Transaksi pembayaran
│   │   │   ├── audit/        # Audit trail (superadmin)
│   │   │   └── admin-users/  # Kelola admin (superadmin)
│   │   └── lib/api.ts        # Axios API client
│   └── package.json
├── mobile/
│   ├── app/
│   │   ├── (tabs)/           # Home, Scan, Laporan, Riwayat
│   │   └── payment.tsx       # Layar pembayaran QRIS
│   ├── src/
│   │   ├── services/api.ts   # Axios client mobile
│   │   └── store/authStore.ts # Zustand auth state
│   └── app.json
├── database/
│   ├── migrations/001_init.sql   # Schema 10 tabel
│   └── seeds/001_seed.sql        # Data awal
└── docs/
    └── api.md                # Dokumentasi API lengkap
```

---

## Fitur Utama

| # | Fitur | Platform | Prioritas |
|---|---|---|---|
| 1 | Scan & Validasi QR Code | Mobile | ✅ Tinggi |
| 2 | Lapor Parkir Ilegal | Mobile | ✅ Tinggi |
| 3 | Pembayaran Digital QRIS | Mobile | ✅ Tinggi |
| 4 | Dashboard Monitoring Real-time | Admin Web | ✅ Tinggi |
| 5 | Manajemen Petugas & QR Badge | Admin Web | ✅ Tinggi |
| 6 | Manajemen Laporan | Admin Web | ✅ Tinggi |
| 7 | Notifikasi & Emergency Alert | Mobile + Admin | ✅ Tinggi |
| 8 | Administrasi Superadmin | Admin Web | ✅ Tinggi |
| 9 | Riwayat Pembayaran | Mobile | 📅 Future |

---

## Keamanan

- **Autentikasi:** JWT + Refresh Token (expiry 15 menit, auto-logout admin 30 menit)
- **Enkripsi:** AES-256 untuk data sensitif, bcrypt untuk password
- **RBAC:** Setiap endpoint diproteksi dengan role check
- **Rate Limiting:** 100 req/menit global, 5 laporan/hari per user
- **Input Validation:** Server-side validation di semua endpoint

---

## Kepatuhan Hukum

- UU No. 27/2022 (UU PDP) — enkripsi identitas pelapor
- Standar QRIS Bank Indonesia
- PCI DSS untuk transaksi pembayaran
- Perda Kota Medan tentang retribusi parkir

---

*Developed for Dinas Perhubungan Kota Medan — LohParkir © 2024*
