# PROMPT: Bangun Aplikasi LohParkir — Sistem Validasi Parkir Resmi Kota Medan

---

## KONTEKS UMUM

Bangun aplikasi bernama **LohParkir**, yaitu sistem manajemen dan validasi parkir resmi berbasis QR Code untuk Kota Medan yang dikelola oleh Dinas Perhubungan (Dishub) Medan. Aplikasi ini terdiri dari **tiga platform terpisah**:

1. **Mobile App** — untuk masyarakat umum dan petugas parkir (React Native / Expo, Android & iOS)
2. **Admin Dashboard (Web)** — untuk Admin Dishub dan Superadmin (berbasis web browser)
3. **Backend API** — Node.js + Express.js, database PostgreSQL

---

## STACK TEKNOLOGI

| Layer | Teknologi |
|---|---|
| Mobile App | React Native + Expo (cross-platform Android 8.0+ / iOS 14.0+) |
| Admin Dashboard | React.js / Next.js (web-based, responsif minimum 1366x768px) |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (UUID primary keys, indexing) |
| Autentikasi | JWT (expiry + refresh token, session timeout 30 menit untuk admin) |
| Push Notifikasi | Firebase Cloud Messaging (FCM) |
| Peta & Heatmap | Google Maps API atau Leaflet.js |
| Pembayaran | QRIS Payment Gateway (Bank Indonesia standard, PCI DSS compliant) |
| Keamanan | HTTPS + TLS 1.2+, AES-256 at rest, bcrypt untuk password |
| Bahasa | TypeScript (frontend & backend) |
| Deployment | Containerized (Docker), cloud-based, stateless API, siap horizontal scaling |
| Real-time | Firebase Realtime Database atau WebSocket untuk dashboard |

---

## AKTOR / USER ROLES

### 1. Masyarakat Umum (Public)
Pengguna mobile app. Dapat scan QR, lapor parkir ilegal, bayar via QRIS, lihat riwayat pembayaran. Tidak perlu login untuk scan dan lapor. Tidak ada session timeout.

### 2. Petugas Parkir Resmi (Officer)
Memiliki mobile app khusus (officer app). Didaftarkan oleh Admin Dishub. Fitur terbatas: catat pembayaran tunai dan tombol panik darurat. Tidak dapat akses dashboard, laporan, atau manajemen QR.

### 3. Admin Dishub
Login ke admin dashboard (web). Dapat: lihat dashboard real-time, kelola laporan masuk, daftarkan petugas & generate QR badge, export laporan. Tidak bisa hapus/ubah data database secara langsung.

### 4. Superadmin (Database Administrator)
Akses penuh CRUD ke seluruh data sistem (QR code, lokasi parkir, petugas, tarif). Kelola peran user admin. Lihat audit trail. Konfirmasi wajib sebelum hapus data.

---

## FITUR-FITUR YANG HARUS DIBANGUN

---

### FITUR 1 — SCAN & VALIDASI QR CODE (Mobile App, Prioritas: Tinggi)

**Alur:**
1. User buka app → tap tombol **"Scan QR"**
2. Kamera aktif, user arahkan ke QR badge petugas/lokasi parkir
3. Sistem decode QR dalam ≤1,5 detik
4. Sistem kirim data QR ke backend untuk validasi ke database Dishub
5. **Jika valid:** tampilkan kartu informasi berisi — nama petugas, nomor badge, zona/area kerja, tarif resmi, status aktif/nonaktif
6. **Jika tidak valid/palsu:** tampilkan peringatan merah + tombol **"Laporkan"**
7. **Jika error jaringan:** tampilkan pesan ramah + tombol coba lagi

**Format QR Code resmi:** `LOHPARKIR-DSH-YYYY-NNN` (contoh: `LOHPARKIR-DSH-2024-001`)

**Requirement teknis:**
- Validasi checksum QR untuk cegah pemalsuan
- Tampilkan status aktif/nonaktif petugas
- Pesan error menggunakan bahasa non-teknis (contoh: "QR Code tidak terdaftar" bukan "Error 404")
- Maks 3 tap untuk menyelesaikan scan

---

### FITUR 2 — LAPOR PARKIR ILEGAL (Mobile App, Prioritas: Tinggi)

**Alur A — Setelah scan gagal:**
1. Sistem deteksi QR tidak valid → tampilkan peringatan
2. User tap **"Laporkan"**
3. User upload foto bukti + isi deskripsi singkat
4. Sistem otomatis ambil GPS location
5. Sistem submit laporan → generate nomor tiket laporan
6. User terima notifikasi status tindak lanjut

**Alur B — Langsung dari home (tanpa scan):**
1. User buka tab **"Laporan"** → tap **"Buat Laporan Baru"**
2. Upload foto + isi deskripsi
3. Sistem otomatis ambil GPS
4. Submit → generate nomor tiket

**Requirement teknis:**
- Foto wajib disertakan (mandatory)
- GPS diambil otomatis saat laporan dibuat (bukan tracking terus-menerus)
- Maks 5 laporan per hari per user
- Laporan tidak bisa diedit setelah submit (immutable); user bisa buat laporan baru yang mereferensi nomor tiket sebelumnya
- Identitas pelapor dienkripsi; hanya superadmin yang bisa akses
- Maks 5 tap untuk selesaikan laporan
- Laporan dikirim ke backend → dimoderasi admin sebelum ditindaklanjuti

---

### FITUR 3 — PEMBAYARAN DIGITAL via QRIS (Mobile App, Prioritas: Tinggi)

**Alur:**
1. Setelah scan QR valid, user tap **"Bayar Digital"**
2. Sistem generate QRIS code yang dapat di-scan via mobile banking / e-wallet
3. User scan QRIS di aplikasi bank/e-wallet mereka
4. Sistem terima konfirmasi dari payment gateway via webhook asinkron
5. Tampilkan status pembayaran (berhasil/gagal) + struk digital
6. Transaksi tersimpan di database

**Pembayaran tunai:**
- Petugas catat pembayaran tunai via officer app
- Dicatat real-time atau di akhir shift

**Requirement teknis:**
- Gunakan idempotency key untuk setiap transaksi (cegah double charge)
- Jika gagal, sistem otomatis proses refund
- Setiap transaksi punya audit trail lengkap
- Rekonsiliasi harian wajib
- Patuhi standar Bank Indonesia (QRIS) dan PCI DSS
- Maks 4 tap untuk selesaikan pembayaran
- Simpan riwayat transaksi ≥10 tahun

---

### FITUR 4 — DASHBOARD MONITORING REAL-TIME (Admin Web, Prioritas: Tinggi)

**Tampilan untuk Admin Dishub:**
- Total scan hari ini
- Jumlah QR aktif vs QR palsu/tidak terdaftar
- Grafik tren validasi (harian, mingguan, bulanan)
- Heatmap lokasi scan (integrasi Maps API)
- Notifikasi laporan masuk secara real-time
- Total pendapatan hari ini (QRIS + tunai)
- Jumlah laporan masuk hari ini

**Tampilan Publik (tanpa login):**
- Statistik umum (total scan, total lokasi resmi, total laporan)
- Heatmap distribusi parkir resmi
- Data pribadi dan laporan detail disembunyikan

**Requirement teknis:**
- Data refresh real-time (WebSocket atau Firebase)
- Filter data berdasarkan periode waktu (hari, minggu, bulan, custom)
- Dashboard load ≤3 detik (initial), ≤1 detik (refresh)
- Card-based layout, sidebar navigasi konsisten
- Header selalu tampilkan status koneksi database + notifikasi laporan baru

---

### FITUR 5 — MANAJEMEN AKUN PETUGAS & QR BADGE (Admin Web, Prioritas: Tinggi)

**Alur:**
1. Admin buka halaman **"Manajemen Petugas"**
2. Isi data: nama, NIP, nomor HP, zona kerja yang ditugaskan
3. Sistem validasi input → cek duplikasi (berdasarkan NIP atau nomor badge)
4. Sistem buat record petugas + auto-generate QR code unik format `LOHPARKIR-DSH-YYYY-NNN`
5. Sistem generate QR badge yang bisa dicetak (PDF)
6. Admin cetak dan serahkan badge ke petugas
7. Admin dapat aktifkan/nonaktifkan akun petugas kapan saja

**Requirement teknis:**
- Hanya Admin Dishub atau Superadmin yang bisa generate QR code
- Cegah registrasi duplikat (NIP atau badge number)
- QR code harus unik per petugas
- Badge bisa diexport/print dalam format PDF
- Petugas tidak bisa daftar sendiri (anti-fake registration)

---

### FITUR 6 — RIWAYAT PEMBAYARAN (Mobile App, Prioritas: Rendah/Future)

**Alur:**
1. User buka tab **"Riwayat"** di navigasi bawah
2. Sistem tampilkan daftar pembayaran lalu

**Data yang ditampilkan per item:**
- Tanggal & waktu
- Nama petugas / lokasi parkir
- Nominal yang dibayar
- Metode pembayaran (QRIS / tunai)
- Status transaksi

---

### FITUR 7 — MANAJEMEN LAPORAN (Admin Web, Prioritas: Tinggi)

**Alur:**
1. Admin buka halaman **"Manajemen Laporan"**
2. Tampil daftar laporan dengan filter: status, tanggal, lokasi
3. Admin pilih laporan → lihat detail (foto, GPS, deskripsi, nomor tiket)
4. Admin ubah status: `Diterima → Sedang Diproses → Diselesaikan / Ditolak`
5. Admin bisa tambahkan catatan tindak lanjut
6. Sistem otomatis kirim notifikasi push ke pelapor saat status berubah
7. Admin generate laporan rekapitulasi berdasarkan periode → print/export PDF

**Requirement teknis:**
- Laporan tidak bisa dihapus oleh user maupun admin (immutable setelah submit)
- Status wajib diupdate oleh admin (tidak boleh dibiarkan tanpa tindak lanjut)
- Export laporan dalam format PDF
- Simpan data laporan ≥5 tahun

---

### FITUR 8 — PUSH NOTIFIKASI & EMERGENCY ALERT (Mobile & Admin, Prioritas: Tinggi)

**Tiga jenis notifikasi:**

| Trigger | Penerima | Tipe |
|---|---|---|
| Status laporan diubah admin | Pelapor (user) | Normal push notification |
| Laporan baru masuk dari user | Semua Admin Dishub | Normal push notification |
| Petugas tekan tombol panik | Semua Admin Dishub | **HIGH-PRIORITY EMERGENCY ALERT** |

**Emergency Alert (Panic Button):**
- Hanya bisa diakses petugas resmi via officer app
- Satu kali tap → kirim alert prioritas tinggi ke semua admin
- Alert berisi: nama petugas, nomor badge, koordinat GPS real-time
- Admin terima notifikasi segera (tidak bisa di-delay/batch)

**Requirement teknis:**
- Gunakan Firebase Cloud Messaging (FCM)
- GPS petugas disertakan di emergency alert
- Notifikasi terkirim bahkan saat app dalam kondisi background/closed

---

### FITUR 9 — ADMINISTRASI SISTEM / SUPERADMIN (Admin Web, Prioritas: Tinggi)

**Akses penuh CRUD untuk:**
- Data QR Code resmi
- Data lokasi parkir
- Data petugas parkir
- Data tarif parkir

**Fitur tambahan:**
- Kelola peran user (assign/modify role: public, officer, admin, superadmin)
- Lihat dan cari audit trail (berisi: timestamp, jenis aksi, user ID, data sebelum/sesudah)
- Konfirmasi wajib (dialog konfirmasi) sebelum hapus data apapun
- Semua aksi superadmin otomatis tercatat di audit trail

---

## STRUKTUR DATABASE (PostgreSQL)

Minimal tabel berikut harus ada:

```
users              — id, role, nama, email, password_hash, created_at
officers           — id, user_id, nip, nama, zona_id, qr_code, status, created_at
parking_zones      — id, nama, koordinat, tarif, kota
qr_codes           — id, officer_id, kode (LOHPARKIR-DSH-YYYY-NNN), status, created_at
reports            — id, user_id, foto_url, deskripsi, gps_lat, gps_lng, status, ticket_no, created_at
report_logs        — id, report_id, admin_id, status_baru, catatan, timestamp
transactions       — id, user_id, officer_id, metode, nominal, status, idempotency_key, created_at
scan_logs          — id, user_id, qr_code_id, hasil_validasi, gps_lat, gps_lng, timestamp
notifications      — id, target_user_id, pesan, tipe, is_read, created_at
audit_trail        — id, user_id, aksi, entitas, data_lama, data_baru, timestamp
```

---

## KEAMANAN & NONFUNCTIONAL REQUIREMENTS

- **Autentikasi Admin:** bcrypt + JWT dengan expiry. Auto-logout setelah 30 menit tidak aktif.
- **Enkripsi:** HTTPS + TLS 1.2+ untuk semua komunikasi. AES-256 untuk data sensitif at rest.
- **RBAC:** Setiap API endpoint wajib cek role sebelum izinkan akses.
- **Rate Limiting:** 100 request/menit per user (by IP atau account) untuk semua endpoint.
- **Input Validation:** Validasi server-side wajib untuk cegah SQL injection dan XSS.
- **Privasi:** GPS hanya diambil saat scan/laporan, tidak tracking terus-menerus. Identitas pelapor dienkripsi.
- **Kepatuhan Hukum:** Patuhi UU No. 27/2022 (UU PDP), standar QRIS Bank Indonesia, dan Perda Kota Medan tentang retribusi parkir.

---

## PERFORMA YANG DIHARAPKAN

| Metrik | Target |
|---|---|
| Response time API (normal) | ≤2 detik |
| Response time dengan upload foto | ≤3 detik |
| Deteksi & decode QR code | ≤1,5 detik |
| Dashboard initial load | ≤3 detik |
| Dashboard data refresh | ≤1 detik |
| Concurrent users | Minimal 500 user simultan |
| Scan/laporan per jam | Hingga 1.000/jam |
| Uptime | ≥99,5% jam operasional (06.00–22.00 WIB) |

---

## AKSESIBILITAS & UI/UX

- Seluruh UI dalam Bahasa Indonesia, kata-kata sederhana
- Font minimal 14sp
- Kontras warna ≥4,5:1 (WCAG 2.1 Level AA)
- Touch target minimal 44×44 dp
- Setiap aksi tampilkan loading indicator + pesan sukses/gagal + warna status
- Mobile: fokus satu aksi per layar (portrait mode, layar 4,7"–6,9")
- Navigasi bawah mobile: Home, Scan QR, Laporan, Riwayat
- Error message pakai bahasa ramah (bukan kode teknis)

---

## BATASAN APLIKASI

- Hanya mencakup parkir tepi jalan umum yang dikelola Dishub Medan
- Tidak mencakup parkir gedung, mall, atau area privat
- Tidak terintegrasi dengan sistem retribusi eksternal yang sudah ada (namun dirancang modular untuk integrasi masa depan)
- Arsitektur modular agar dapat diadaptasi untuk kota lain di Indonesia dengan konfigurasi minimal

---

## OUTPUT YANG DIHARAPKAN

Bangun aplikasi LohParkir lengkap dengan:
1. **Mobile App** (React Native/Expo) — untuk masyarakat umum + officer app
2. **Admin Dashboard** (web) — untuk Admin Dishub dan Superadmin
3. **REST API Backend** (Node.js/Express + PostgreSQL) — dengan semua endpoint yang diperlukan
4. **Skema database** PostgreSQL lengkap
5. **Dokumentasi API** minimal (endpoint, method, request/response)

Prioritaskan fitur dengan label **Prioritas: Tinggi** terlebih dahulu: Scan QR, Lapor Parkir Ilegal, Pembayaran QRIS, Dashboard Real-time, Manajemen Petugas & QR Badge, Manajemen Laporan, Notifikasi & Emergency Alert, dan Administrasi Superadmin.
