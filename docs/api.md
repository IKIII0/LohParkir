# LohParkir REST API Documentation

**Sistem Validasi Parkir Resmi — Dinas Perhubungan Kota Medan**

> **Base URL:** `http://localhost:3001/api/v1`  
> **Response Format:** `application/json`  
> **Authentication:** Bearer JWT — kirim header `Authorization: Bearer <accessToken>`

---

## Daftar Isi

1. [Autentikasi & Token](#1-autentikasi--token)
   - [POST /auth/login](#post-authlogin)
   - [POST /auth/refresh](#post-authrefresh)
   - [POST /auth/logout](#post-authlogout)
   - [GET /auth/me](#get-authme)
   - [PUT /auth/fcm-token](#put-authfcm-token)
2. [QR Code](#2-qr-code)
   - [POST /qr/validate](#post-qrvalidate)
   - [POST /qr/generate](#post-qrgenerate)
   - [GET /qr/:id](#get-qrid)
   - [DELETE /qr/:id/revoke](#delete-qridrevoke)
3. [Petugas (Officers)](#3-petugas-officers)
   - [GET /officers](#get-officers)
   - [POST /officers](#post-officers)
   - [GET /officers/:id](#get-officersid)
   - [PUT /officers/:id](#put-officersid)
   - [PATCH /officers/:id/toggle](#patch-officersidtoggle)
4. [Laporan (Reports)](#4-laporan-reports)
   - [GET /reports](#get-reports)
   - [POST /reports](#post-reports)
   - [GET /reports/track/:ticketNo](#get-reportstrackticketno)
   - [GET /reports/:id](#get-reportsid)
   - [PATCH /reports/:id/status](#patch-reportsidstatus)
5. [Transaksi (Transactions)](#5-transaksi-transactions)
   - [POST /transactions](#post-transactions)
   - [POST /transactions/webhook](#post-transactionswebhook)
   - [GET /transactions](#get-transactions)
   - [GET /transactions/my](#get-transactionsmy)
6. [Dashboard](#6-dashboard)
   - [GET /dashboard/stats](#get-dashboardstats)
   - [GET /dashboard/trend](#get-dashboardtrend)
   - [GET /dashboard/revenue](#get-dashboardrevenue)
   - [GET /dashboard/heatmap](#get-dashboardheatmap)
   - [GET /dashboard/public](#get-dashboardpublic)
7. [Zona Parkir (Zones)](#7-zona-parkir-zones)
   - [GET /zones](#get-zones)
   - [POST /zones](#post-zones)
   - [PUT /zones/:id](#put-zonesid)
8. [Notifikasi (Notifications)](#8-notifikasi-notifications)
   - [GET /notifications](#get-notifications)
   - [PATCH /notifications/:id/read](#patch-notificationsidread)
   - [PATCH /notifications/read-all](#patch-notificationsread-all)
9. [Administrasi (Admin / Superadmin)](#9-administrasi-admin--superadmin)
   - [GET /admin/audit](#get-adminaudit)
   - [GET /admin/users](#get-adminusers)
   - [PATCH /admin/users/:id/role](#patch-adminusersid-role)
   - [PATCH /admin/users/:id/toggle](#patch-adminusersidtoggle)
   - [POST /admin/users](#post-adminusers)
   - [POST /admin/emergency](#post-adminemergency)
10. [Error Responses](#10-error-responses)
11. [Rate Limiting](#11-rate-limiting)
12. [Format QR Code](#12-format-qr-code)
13. [WebSocket Events](#13-websocket-events)

---

## Tingkat Akses (Roles)

| Role | Deskripsi |
|---|---|
| `public` | Tidak perlu login sama sekali |
| `officer` | Petugas parkir lapangan |
| `admin` | Administrator Dishub |
| `superadmin` | Super Administrator — akses penuh |

---

## 1. Autentikasi & Token

### `POST /auth/login`

Login ke sistem. Mengembalikan access token (15 menit) dan refresh token (7 hari).

**Auth required:** Tidak  
**Rate limit:** 10 request / 15 menit per IP

**Request Body:**

```json
{
  "email": "admin1@dishubmedan.id",
  "password": "LohParkir@2024"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Selamat datang, Admin Dishub Medan 1!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTcwMDAwMDAsImV4cCI6MTcxNzAwMDkwMH0.abc123",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcxNzAwMDAwMCwiZXhwIjoxNzE3NjA0ODAwfQ.xyz789",
    "user": {
      "id": "00000000-0000-0000-0000-000000000002",
      "nama": "Admin Dishub Medan 1",
      "email": "admin1@dishubmedan.id",
      "role": "admin",
      "isActive": true
    }
  }
}
```

**Response `400 Bad Request`** — validasi gagal:

```json
{
  "success": false,
  "message": "Email dan password wajib diisi"
}
```

**Response `401 Unauthorized`** — kredensial salah:

```json
{
  "success": false,
  "message": "Email atau password salah"
}
```

---

### `POST /auth/refresh`

Tukar refresh token yang masih valid dengan access token baru.

**Auth required:** Tidak

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response `401 Unauthorized`** — token tidak valid atau kedaluwarsa:

```json
{
  "success": false,
  "message": "Refresh token tidak valid atau sudah kedaluwarsa"
}
```

---

### `POST /auth/logout`

Cabut refresh token sehingga sesi tidak bisa diperbarui lagi.

**Auth required:** Ya (semua role)

**Request Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

### `GET /auth/me`

Ambil data profil pengguna yang sedang login.

**Auth required:** Ya (semua role)

**Request Headers:**

```
Authorization: Bearer <accessToken>
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000002",
    "nama": "Admin Dishub Medan 1",
    "email": "admin1@dishubmedan.id",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### `PUT /auth/fcm-token`

Perbarui FCM (Firebase Cloud Messaging) token perangkat untuk push notification.

**Auth required:** Ya (semua role)

**Request Body:**

```json
{
  "fcmToken": "fXtKv2mNpQr8sTeUwVxYz1A3bCdEfGhIjKlMnOpQrStUvWxYz..."
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "FCM token berhasil diperbarui"
}
```

---

## 2. QR Code

Format kode QR: `LOHPARKIR-DSH-YYYY-NNN`  
Contoh: `LOHPARKIR-DSH-2024-001`

Lihat bagian [Format QR Code](#12-format-qr-code) untuk spesifikasi lengkap.

---

### `POST /qr/validate`

Validasi kode QR yang di-scan oleh masyarakat. Endpoint ini **public** — tidak memerlukan login.  
Setiap scan akan tercatat dalam log sistem beserta koordinat GPS.

**Auth required:** Tidak  
**Rate limit:** 100 request / menit per IP (global)

**Request Body:**

```json
{
  "kode": "LOHPARKIR-DSH-2024-001",
  "gpsLat": 3.5896,
  "gpsLng": 98.6789
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `kode` | string | Ya | Kode QR hasil scan |
| `gpsLat` | number | Ya | Latitude lokasi masyarakat |
| `gpsLng` | number | Ya | Longitude lokasi masyarakat |

**Response `200 OK` — QR Valid:**

```json
{
  "success": true,
  "valid": true,
  "hasil": "valid",
  "pesan": "QR Code valid — Petugas resmi Dishub Medan",
  "data": {
    "officerId": "20000000-0000-0000-0000-000000000001",
    "namaPetugas": "Budi Santoso",
    "nip": "198501010001",
    "badgeNumber": "DSH-2024-001",
    "statusPetugas": "aktif",
    "zona": {
      "id": "10000000-0000-0000-0000-000000000001",
      "nama": "Zona A — Pusat Pasar",
      "alamat": "Jl. Pusat Pasar, Medan Kota",
      "tarifMotor": 2000,
      "tarifMobil": 5000
    }
  },
  "scanId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response `200 OK` — QR Tidak Valid / Tidak Terdaftar:**

```json
{
  "success": true,
  "valid": false,
  "hasil": "invalid",
  "pesan": "QR Code tidak terdaftar dalam sistem Dishub Medan",
  "scanId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

**Response `200 OK` — QR Dicabut / Petugas Nonaktif:**

```json
{
  "success": true,
  "valid": false,
  "hasil": "revoked",
  "pesan": "QR Code ini sudah tidak aktif. Laporkan jika petugas tetap meminta pembayaran.",
  "scanId": "c3d4e5f6-a7b8-9012-cdef-123456789012"
}
```

**Response `400 Bad Request`:**

```json
{
  "success": false,
  "message": "Field kode, gpsLat, dan gpsLng wajib diisi"
}
```

---

### `POST /qr/generate`

Buat QR code baru untuk petugas tertentu. Satu petugas hanya dapat memiliki satu QR code aktif.

**Auth required:** Ya (`admin`, `superadmin`)

**Request Body:**

```json
{
  "officerId": "20000000-0000-0000-0000-000000000006"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "message": "QR Code berhasil dibuat untuk Nama Petugas",
  "data": {
    "id": "qr-uuid-here",
    "kode": "LOHPARKIR-DSH-2024-006",
    "officerId": "20000000-0000-0000-0000-000000000006",
    "status": "aktif",
    "qrImageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "createdAt": "2024-06-02T14:00:00.000Z"
  }
}
```

**Response `409 Conflict`** — petugas sudah punya QR aktif:

```json
{
  "success": false,
  "message": "Petugas ini sudah memiliki QR Code aktif. Cabut terlebih dahulu sebelum membuat yang baru."
}
```

---

### `GET /qr/:id`

Ambil detail QR code berdasarkan ID.

**Auth required:** Ya (`admin`, `superadmin`)

**Path Parameter:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | ID QR code |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "qr-uuid-here",
    "kode": "LOHPARKIR-DSH-2024-001",
    "status": "aktif",
    "officer": {
      "id": "20000000-0000-0000-0000-000000000001",
      "nama": "Budi Santoso",
      "nip": "198501010001",
      "badgeNumber": "DSH-2024-001"
    },
    "totalScan": 142,
    "lastScannedAt": "2024-06-02T13:45:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "revokedAt": null,
    "revokedBy": null
  }
}
```

**Response `404 Not Found`:**

```json
{
  "success": false,
  "message": "QR Code tidak ditemukan"
}
```

---

### `DELETE /qr/:id/revoke`

Cabut (nonaktifkan) sebuah QR code. QR yang sudah dicabut tidak dapat diaktifkan kembali — harus buat baru.

**Auth required:** Ya (`admin`, `superadmin`)

**Path Parameter:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | ID QR code yang akan dicabut |

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "QR Code LOHPARKIR-DSH-2024-001 berhasil dicabut",
  "data": {
    "id": "qr-uuid-here",
    "kode": "LOHPARKIR-DSH-2024-001",
    "status": "revoked",
    "revokedAt": "2024-06-02T14:00:00.000Z"
  }
}
```

---

## 3. Petugas (Officers)

### `GET /officers`

Ambil daftar petugas dengan filter dan pagination.

**Auth required:** Ya (`admin`, `superadmin`)

**Query Parameters:**

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `status` | string | — | `aktif` \| `nonaktif` \| `suspended` |
| `zonaId` | UUID | — | Filter berdasarkan zona |
| `search` | string | — | Pencarian nama, NIP, atau badge number |
| `page` | integer | `1` | Halaman saat ini |
| `limit` | integer | `20` | Jumlah data per halaman (maks. 100) |

**Contoh Request:**

```
GET /officers?status=aktif&search=budi&page=1&limit=20
Authorization: Bearer <accessToken>
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "20000000-0000-0000-0000-000000000001",
      "nama": "Budi Santoso",
      "nip": "198501010001",
      "badgeNumber": "DSH-2024-001",
      "nomorHp": "081234567891",
      "status": "aktif",
      "email": "officer.198501010001@lohparkir.id",
      "zonaId": "10000000-0000-0000-0000-000000000001",
      "zonaNama": "Zona A — Pusat Pasar",
      "qrKode": "LOHPARKIR-DSH-2024-001",
      "qrStatus": "aktif",
      "totalScanHariIni": 12,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### `POST /officers`

Daftarkan petugas baru. Sistem otomatis membuat akun login dan badge number.  
Password sementara **hanya ditampilkan satu kali** dalam response ini.

**Auth required:** Ya (`admin`, `superadmin`)

**Request Body:**

```json
{
  "nip": "199001010006",
  "nama": "Andi Kurniawan",
  "nomorHp": "081234567896",
  "zonaId": "10000000-0000-0000-0000-000000000002"
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `nip` | string | Ya | NIP 12–18 digit, unik |
| `nama` | string | Ya | Nama lengkap petugas |
| `nomorHp` | string | Ya | Nomor HP aktif |
| `zonaId` | UUID | Ya | ID zona penugasan |

**Response `201 Created`:**

```json
{
  "success": true,
  "message": "Petugas Andi Kurniawan berhasil didaftarkan",
  "data": {
    "id": "20000000-0000-0000-0000-000000000006",
    "nama": "Andi Kurniawan",
    "nip": "199001010006",
    "badgeNumber": "DSH-2024-006",
    "email": "officer.199001010006@lohparkir.id",
    "tempPassword": "LohParkir@0006",
    "zonaId": "10000000-0000-0000-0000-000000000002",
    "createdAt": "2024-06-02T14:00:00.000Z"
  }
}
```

> **Catatan keamanan:** `tempPassword` hanya muncul pada response pertama ini. Simpan dengan aman dan sampaikan ke petugas secara langsung.

**Response `409 Conflict`** — NIP sudah terdaftar:

```json
{
  "success": false,
  "message": "NIP 199001010006 sudah terdaftar dalam sistem"
}
```

---

### `GET /officers/:id`

Ambil detail lengkap seorang petugas beserta riwayat scan.

**Auth required:** Ya (`admin`, `superadmin`)

**Path Parameter:** `id` — UUID petugas

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "20000000-0000-0000-0000-000000000001",
    "nama": "Budi Santoso",
    "nip": "198501010001",
    "badgeNumber": "DSH-2024-001",
    "nomorHp": "081234567891",
    "email": "officer.198501010001@lohparkir.id",
    "status": "aktif",
    "zona": {
      "id": "10000000-0000-0000-0000-000000000001",
      "nama": "Zona A — Pusat Pasar"
    },
    "qrCode": {
      "id": "qr-uuid",
      "kode": "LOHPARKIR-DSH-2024-001",
      "status": "aktif",
      "totalScan": 142
    },
    "stats": {
      "totalScan": 142,
      "totalTransaksi": 98,
      "totalPendapatan": 245000
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response `404 Not Found`:**

```json
{
  "success": false,
  "message": "Petugas tidak ditemukan"
}
```

---

### `PUT /officers/:id`

Perbarui data petugas.

**Auth required:** Ya (`admin`, `superadmin`)

**Path Parameter:** `id` — UUID petugas

**Request Body** (semua field opsional):

```json
{
  "nama": "Budi Santoso Wijaya",
  "nomorHp": "081298765432",
  "zonaId": "10000000-0000-0000-0000-000000000003"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Data petugas berhasil diperbarui",
  "data": {
    "id": "20000000-0000-0000-0000-000000000001",
    "nama": "Budi Santoso Wijaya",
    "nomorHp": "081298765432",
    "zonaId": "10000000-0000-0000-0000-000000000003",
    "updatedAt": "2024-06-02T14:00:00.000Z"
  }
}
```

---

### `PATCH /officers/:id/toggle`

Aktifkan atau nonaktifkan petugas. Status akan berubah secara toggle: `aktif` ↔ `nonaktif`.

**Auth required:** Ya (`admin`, `superadmin`)

**Path Parameter:** `id` — UUID petugas

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Status petugas Budi Santoso berhasil diubah menjadi nonaktif",
  "data": {
    "id": "20000000-0000-0000-0000-000000000001",
    "nama": "Budi Santoso",
    "status": "nonaktif"
  }
}
```

---

## 4. Laporan (Reports)

### `GET /reports`

Ambil daftar laporan masyarakat dengan filter.

**Auth required:** Ya (`admin`, `superadmin`)

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `status` | string | `diterima` \| `sedang_diproses` \| `diselesaikan` \| `ditolak` |
| `startDate` | string | Filter tanggal mulai, format `YYYY-MM-DD` |
| `endDate` | string | Filter tanggal akhir, format `YYYY-MM-DD` |
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20`, maks. `100` |

**Contoh Request:**

```
GET /reports?status=diterima&startDate=2024-06-01&endDate=2024-06-30&page=1&limit=20
Authorization: Bearer <accessToken>
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "rpt-uuid-here",
      "ticketNo": "RPT-20240602-00001",
      "status": "diterima",
      "deskripsi": "Petugas meminta tarif tidak sesuai zona",
      "fotoUrl": "https://storage.lohparkir.id/reports/rpt-uuid-here.jpg",
      "gpsLat": 3.5896,
      "gpsLng": 98.6789,
      "alamatLokasi": "Jl. Pusat Pasar, Medan Kota",
      "createdAt": "2024-06-02T14:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 30,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

---

### `POST /reports`

Kirim laporan pelanggaran oleh masyarakat. Endpoint ini **public** — tidak memerlukan login.

**Auth required:** Tidak  
**Rate limit:** 5 laporan / hari per IP  
**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `foto` | File | Ya | Foto bukti (JPG / PNG / WebP, maks. 5 MB) |
| `deskripsi` | string | Tidak | Deskripsi kejadian |
| `gpsLat` | number | Ya | Latitude lokasi kejadian |
| `gpsLng` | number | Ya | Longitude lokasi kejadian |
| `alamatLokasi` | string | Tidak | Alamat lokasi dalam teks |
| `relatedScanId` | UUID | Tidak | ID scan log yang berkaitan |
| `referensiTiket` | string | Tidak | Nomor tiket laporan sebelumnya |

**Response `201 Created`:**

```json
{
  "success": true,
  "message": "Laporan berhasil dikirim. Simpan nomor tiket Anda untuk memantau status.",
  "data": {
    "reportId": "rpt-uuid-here",
    "ticketNo": "RPT-20240602-00001",
    "status": "diterima",
    "createdAt": "2024-06-02T14:00:00.000Z"
  }
}
```

**Response `429 Too Many Requests`** — melampaui batas harian:

```json
{
  "success": false,
  "message": "Batas pengiriman laporan hari ini sudah tercapai (maks. 5 laporan per hari)"
}
```

**Response `400 Bad Request`** — file bukan gambar:

```json
{
  "success": false,
  "message": "File foto harus berformat JPG, PNG, atau WebP"
}
```

---

### `GET /reports/track/:ticketNo`

Lacak status laporan menggunakan nomor tiket. **Public** — tidak memerlukan login.

**Auth required:** Tidak

**Path Parameter:**

| Parameter | Tipe | Contoh |
|---|---|---|
| `ticketNo` | string | `RPT-20240602-00001` |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "ticketNo": "RPT-20240602-00001",
    "status": "sedang_diproses",
    "deskripsi": "Petugas meminta tarif tidak sesuai zona",
    "alamatLokasi": "Jl. Pusat Pasar, Medan Kota",
    "createdAt": "2024-06-02T14:00:00.000Z",
    "logHistory": [
      {
        "statusBaru": "diterima",
        "catatan": "Laporan diterima oleh sistem",
        "timestamp": "2024-06-02T14:00:00.000Z"
      },
      {
        "statusBaru": "sedang_diproses",
        "catatan": "Tim lapangan sedang melakukan investigasi",
        "timestamp": "2024-06-02T16:30:00.000Z"
      }
    ]
  }
}
```

**Response `404 Not Found`:**

```json
{
  "success": false,
  "message": "Nomor tiket RPT-20240602-00001 tidak ditemukan"
}
```

---

### `GET /reports/:id`

Ambil detail lengkap laporan berdasarkan ID internal (bukan nomor tiket).

**Auth required:** Ya (`admin`, `superadmin`)

**Path Parameter:** `id` — UUID laporan

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "rpt-uuid-here",
    "ticketNo": "RPT-20240602-00001",
    "status": "sedang_diproses",
    "deskripsi": "Petugas meminta tarif tidak sesuai zona",
    "fotoUrl": "https://storage.lohparkir.id/reports/rpt-uuid-here.jpg",
    "gpsLat": 3.5896,
    "gpsLng": 98.6789,
    "alamatLokasi": "Jl. Pusat Pasar, Medan Kota",
    "relatedScanId": "scan-uuid",
    "logHistory": [
      {
        "statusBaru": "diterima",
        "catatan": "Laporan diterima oleh sistem",
        "changedBy": null,
        "timestamp": "2024-06-02T14:00:00.000Z"
      },
      {
        "statusBaru": "sedang_diproses",
        "catatan": "Tim lapangan sedang melakukan investigasi",
        "changedBy": "Admin Dishub Medan 1",
        "timestamp": "2024-06-02T16:30:00.000Z"
      }
    ],
    "createdAt": "2024-06-02T14:00:00.000Z",
    "updatedAt": "2024-06-02T16:30:00.000Z"
  }
}
```

---

### `PATCH /reports/:id/status`

Perbarui status laporan dan tambahkan catatan dari admin.

**Auth required:** Ya (`admin`, `superadmin`)

**Path Parameter:** `id` — UUID laporan

**Request Body:**

```json
{
  "status": "sedang_diproses",
  "catatan": "Tim lapangan sedang melakukan investigasi di lokasi"
}
```

| Field | Tipe | Wajib | Nilai yang valid |
|---|---|---|---|
| `status` | string | Ya | `sedang_diproses` \| `diselesaikan` \| `ditolak` |
| `catatan` | string | Tidak | Catatan tindak lanjut |

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Status laporan RPT-20240602-00001 berhasil diperbarui",
  "data": {
    "id": "rpt-uuid-here",
    "ticketNo": "RPT-20240602-00001",
    "status": "sedang_diproses",
    "updatedAt": "2024-06-02T16:30:00.000Z"
  }
}
```

---

## 5. Transaksi (Transactions)

### `POST /transactions`

Buat transaksi pembayaran parkir baru. Mendukung metode QRIS (online) dan tunai.  
`idempotencyKey` digunakan untuk mencegah transaksi duplikat jika request dikirim ulang.

**Auth required:** Tidak (public)

**Request Body:**

```json
{
  "officerId": "20000000-0000-0000-0000-000000000001",
  "zonaId": "10000000-0000-0000-0000-000000000001",
  "nominal": 5000,
  "metode": "qris",
  "idempotencyKey": "unique-client-key-abc123"
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `officerId` | UUID | Ya | ID petugas yang melayani |
| `zonaId` | UUID | Ya | ID zona parkir |
| `nominal` | integer | Ya | Nominal dalam Rupiah (kelipatan 500) |
| `metode` | string | Ya | `qris` \| `tunai` |
| `idempotencyKey` | string | Tidak | Key unik dari client untuk mencegah duplikasi |

**Response `201 Created` — QRIS:**

```json
{
  "success": true,
  "message": "QRIS berhasil dibuat. Scan kode untuk membayar.",
  "data": {
    "transactionId": "trx-uuid-here",
    "status": "pending",
    "metode": "qris",
    "nominal": 5000,
    "paymentUrl": "https://mock-payment.lohparkir.id/pay?ref=MOCK-TRX-001",
    "expiredAt": "2024-06-02T14:15:00.000Z"
  }
}
```

**Response `201 Created` — Tunai:**

```json
{
  "success": true,
  "message": "Pembayaran tunai berhasil dicatat",
  "data": {
    "transactionId": "trx-uuid-here",
    "status": "berhasil",
    "metode": "tunai",
    "nominal": 2000,
    "createdAt": "2024-06-02T14:00:00.000Z"
  }
}
```

**Response `409 Conflict`** — idempotency key sudah digunakan:

```json
{
  "success": false,
  "message": "Transaksi dengan key ini sudah pernah dibuat",
  "data": {
    "transactionId": "trx-uuid-existing"
  }
}
```

---

### `POST /transactions/webhook`

Endpoint callback dari payment gateway untuk konfirmasi pembayaran QRIS.

**Auth required:** Tidak (diamankan dengan signature validation di header)

**Request Headers:**

```
X-Webhook-Signature: sha256=<hmac-signature>
```

**Request Body:**

```json
{
  "transactionId": "trx-uuid-here",
  "qrisRef": "QRIS-REF-20240602-ABC",
  "status": "settlement",
  "paidAt": "2024-06-02T14:05:00.000Z"
}
```

| Field `status` | Arti |
|---|---|
| `settlement` | Pembayaran berhasil |
| `expire` | QRIS kedaluwarsa |
| `cancel` | Dibatalkan |

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Webhook berhasil diproses"
}
```

---

### `GET /transactions`

Ambil seluruh daftar transaksi (semua petugas dan zona).

**Auth required:** Ya (`admin`, `superadmin`)

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `officerId` | UUID | Filter berdasarkan petugas |
| `zonaId` | UUID | Filter berdasarkan zona |
| `metode` | string | `qris` \| `tunai` |
| `status` | string | `pending` \| `berhasil` \| `gagal` \| `expired` |
| `startDate` | string | Format `YYYY-MM-DD` |
| `endDate` | string | Format `YYYY-MM-DD` |
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20` |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "trx-uuid-here",
      "nominal": 5000,
      "metode": "qris",
      "status": "berhasil",
      "officerNama": "Budi Santoso",
      "zonaNama": "Zona A — Pusat Pasar",
      "createdAt": "2024-06-02T14:00:00.000Z",
      "settledAt": "2024-06-02T14:05:00.000Z"
    }
  ],
  "summary": {
    "totalTransaksi": 98,
    "totalNominal": 245000,
    "totalQris": 145000,
    "totalTunai": 100000
  },
  "pagination": {
    "total": 98,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### `GET /transactions/my`

Ambil riwayat transaksi milik pengguna yang sedang login.

**Auth required:** Ya (semua role)

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20` |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "trx-uuid-here",
      "nominal": 5000,
      "metode": "qris",
      "status": "berhasil",
      "zonaNama": "Zona A — Pusat Pasar",
      "createdAt": "2024-06-02T14:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## 6. Dashboard

### `GET /dashboard/stats`

Statistik operasional hari ini: scan, laporan, dan pendapatan.

**Auth required:** Ya (`admin`, `superadmin`)

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "scanHariIni": 45,
    "scanValid": 42,
    "scanInvalid": 3,
    "totalQrAktif": 4,
    "laporanHariIni": 2,
    "laporanPending": 1,
    "pendapatanHariIni": 125000,
    "pendapatanQris": 75000,
    "pendapatanTunai": 50000,
    "generatedAt": "2024-06-02T14:00:00.000Z"
  }
}
```

---

### `GET /dashboard/trend`

Data tren scan harian atau mingguan untuk keperluan grafik.

**Auth required:** Ya (`admin`, `superadmin`)

**Query Parameters:**

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `period` | string | `daily` | `daily` \| `weekly` |
| `days` | integer | `30` | Jumlah hari ke belakang (maks. 365) |

**Contoh Request:**

```
GET /dashboard/trend?period=daily&days=7
Authorization: Bearer <accessToken>
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    { "tanggal": "2024-05-27", "scanValid": 38, "scanInvalid": 2, "totalScan": 40 },
    { "tanggal": "2024-05-28", "scanValid": 41, "scanInvalid": 1, "totalScan": 42 },
    { "tanggal": "2024-05-29", "scanValid": 35, "scanInvalid": 4, "totalScan": 39 },
    { "tanggal": "2024-05-30", "scanValid": 29, "scanInvalid": 0, "totalScan": 29 },
    { "tanggal": "2024-05-31", "scanValid": 44, "scanInvalid": 3, "totalScan": 47 },
    { "tanggal": "2024-06-01", "scanValid": 50, "scanInvalid": 2, "totalScan": 52 },
    { "tanggal": "2024-06-02", "scanValid": 42, "scanInvalid": 3, "totalScan": 45 }
  ]
}
```

---

### `GET /dashboard/revenue`

Data pendapatan harian untuk grafik revenue.

**Auth required:** Ya (`admin`, `superadmin`)

**Query Parameters:**

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `days` | integer | `30` | Jumlah hari ke belakang |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "tanggal": "2024-06-01",
      "totalPendapatan": 235000,
      "pendapatanQris": 135000,
      "pendapatanTunai": 100000,
      "jumlahTransaksi": 47
    },
    {
      "tanggal": "2024-06-02",
      "totalPendapatan": 125000,
      "pendapatanQris": 75000,
      "pendapatanTunai": 50000,
      "jumlahTransaksi": 25
    }
  ],
  "summary": {
    "totalPendapatan": 360000,
    "rataRataPerHari": 180000
  }
}
```

---

### `GET /dashboard/heatmap`

Data GPS seluruh scan untuk visualisasi heatmap peta. **Public**.

**Auth required:** Tidak

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    { "lat": 3.5896, "lng": 98.6789, "hasilValidasi": "valid", "count": 15 },
    { "lat": 3.5812, "lng": 98.6745, "hasilValidasi": "invalid", "count": 3 },
    { "lat": 3.5923, "lng": 98.6812, "hasilValidasi": "valid", "count": 8 }
  ]
}
```

---

### `GET /dashboard/public`

Statistik ringkas untuk ditampilkan di halaman publik tanpa login.

**Auth required:** Tidak

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "totalScan": 1250,
    "totalLokasiResmi": 5,
    "totalLaporan": 30,
    "totalPetugasAktif": 4,
    "lastUpdated": "2024-06-02T14:00:00.000Z"
  }
}
```

---

## 7. Zona Parkir (Zones)

### `GET /zones`

Ambil daftar seluruh zona parkir resmi. **Public**.

**Auth required:** Tidak

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "10000000-0000-0000-0000-000000000001",
      "nama": "Zona A — Pusat Pasar",
      "alamat": "Jl. Pusat Pasar, Medan Kota",
      "tarifMotor": 2000,
      "tarifMobil": 5000,
      "koordinatLat": 3.5896,
      "koordinatLng": 98.6789,
      "isActive": true,
      "jumlahPetugas": 1
    },
    {
      "id": "10000000-0000-0000-0000-000000000002",
      "nama": "Zona B — Lapangan Merdeka",
      "alamat": "Jl. Balai Kota, Medan Kota",
      "tarifMotor": 2000,
      "tarifMobil": 5000,
      "koordinatLat": 3.5812,
      "koordinatLng": 98.6745,
      "isActive": true,
      "jumlahPetugas": 1
    }
  ]
}
```

---

### `POST /zones`

Buat zona parkir baru.

**Auth required:** Ya (`admin`, `superadmin`)

**Request Body:**

```json
{
  "nama": "Zona F — Sun Plaza",
  "alamat": "Jl. K. H. Zainul Arifin No.7, Medan Petisah",
  "tarifMotor": 2000,
  "tarifMobil": 5000,
  "koordinatLat": 3.5960,
  "koordinatLng": 98.6620
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "message": "Zona F — Sun Plaza berhasil ditambahkan",
  "data": {
    "id": "10000000-0000-0000-0000-000000000006",
    "nama": "Zona F — Sun Plaza",
    "alamat": "Jl. K. H. Zainul Arifin No.7, Medan Petisah",
    "tarifMotor": 2000,
    "tarifMobil": 5000,
    "isActive": true,
    "createdAt": "2024-06-02T14:00:00.000Z"
  }
}
```

---

### `PUT /zones/:id`

Perbarui data zona parkir.

**Auth required:** Ya (`admin`, `superadmin`)

**Path Parameter:** `id` — UUID zona

**Request Body** (semua field opsional):

```json
{
  "nama": "Zona A — Pusat Pasar (Revisi)",
  "tarifMotor": 3000,
  "tarifMobil": 6000,
  "isActive": false
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Data zona berhasil diperbarui",
  "data": {
    "id": "10000000-0000-0000-0000-000000000001",
    "nama": "Zona A — Pusat Pasar (Revisi)",
    "tarifMotor": 3000,
    "tarifMobil": 6000,
    "isActive": false,
    "updatedAt": "2024-06-02T14:00:00.000Z"
  }
}
```

---

## 8. Notifikasi (Notifications)

### `GET /notifications`

Ambil daftar notifikasi untuk pengguna yang sedang login.

**Auth required:** Ya (semua role)

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20` |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid-here",
      "judul": "Laporan Baru Masuk",
      "pesan": "Laporan RPT-20240602-00001 telah diterima dan sedang ditinjau",
      "tipe": "new_report",
      "isRead": false,
      "createdAt": "2024-06-02T14:00:00.000Z"
    }
  ],
  "unreadCount": 3,
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### `PATCH /notifications/:id/read`

Tandai satu notifikasi sebagai sudah dibaca.

**Auth required:** Ya (semua role)

**Path Parameter:** `id` — UUID notifikasi

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Notifikasi berhasil ditandai sebagai dibaca"
}
```

---

### `PATCH /notifications/read-all`

Tandai semua notifikasi milik pengguna saat ini sebagai sudah dibaca.

**Auth required:** Ya (semua role)

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Semua notifikasi telah ditandai sebagai dibaca",
  "data": {
    "updatedCount": 3
  }
}
```

---

## 9. Administrasi (Admin / Superadmin)

Seluruh endpoint di bagian ini hanya dapat diakses oleh **Superadmin**, kecuali `POST /admin/emergency` yang diperuntukkan bagi petugas (officer).

---

### `GET /admin/audit`

Ambil audit trail seluruh aktivitas sistem.

**Auth required:** Ya (`superadmin`)

**Query Parameters:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `userId` | UUID | Filter berdasarkan pengguna |
| `aksi` | string | Jenis aksi, misal: `LOGIN`, `CREATE_OFFICER`, `REVOKE_QR` |
| `entitas` | string | Entitas yang terpengaruh, misal: `Officer`, `QrCode`, `Report` |
| `startDate` | string | Format `YYYY-MM-DD` |
| `endDate` | string | Format `YYYY-MM-DD` |
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `50` |

**Contoh Request:**

```
GET /admin/audit?aksi=LOGIN&startDate=2024-06-01&page=1
Authorization: Bearer <superadminToken>
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "audit-uuid-here",
      "userId": "00000000-0000-0000-0000-000000000001",
      "userNama": "Superadmin",
      "aksi": "LOGIN",
      "entitas": "User",
      "entitasId": "00000000-0000-0000-0000-000000000001",
      "detail": { "ipAddress": "192.168.1.1", "userAgent": "Mozilla/5.0..." },
      "createdAt": "2024-06-02T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 250,
    "page": 1,
    "limit": 50,
    "totalPages": 5
  }
}
```

---

### `GET /admin/users`

Ambil daftar seluruh pengguna sistem (admin, officer, superadmin).

**Auth required:** Ya (`superadmin`)

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "nama": "Superadmin",
      "email": "superadmin@dishubmedan.id",
      "role": "superadmin",
      "isActive": true,
      "lastLoginAt": "2024-06-02T08:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "nama": "Admin Dishub Medan 1",
      "email": "admin1@dishubmedan.id",
      "role": "admin",
      "isActive": true,
      "lastLoginAt": "2024-06-02T09:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `PATCH /admin/users/:id/role`

Ubah role (peran) seorang pengguna.

**Auth required:** Ya (`superadmin`)

**Path Parameter:** `id` — UUID pengguna

**Request Body:**

```json
{
  "role": "admin"
}
```

Nilai `role` yang valid: `officer` \| `admin` \| `superadmin`

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Role pengguna Admin Dishub Medan 1 berhasil diubah menjadi superadmin",
  "data": {
    "id": "00000000-0000-0000-0000-000000000002",
    "nama": "Admin Dishub Medan 1",
    "role": "superadmin"
  }
}
```

---

### `PATCH /admin/users/:id/toggle`

Aktifkan atau nonaktifkan akun pengguna.

**Auth required:** Ya (`superadmin`)

**Path Parameter:** `id` — UUID pengguna

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Akun Admin Dishub Medan 1 berhasil dinonaktifkan",
  "data": {
    "id": "00000000-0000-0000-0000-000000000002",
    "nama": "Admin Dishub Medan 1",
    "isActive": false
  }
}
```

---

### `POST /admin/users`

Buat akun admin baru langsung oleh superadmin.

**Auth required:** Ya (`superadmin`)

**Request Body:**

```json
{
  "nama": "Admin Baru",
  "email": "admin.baru@dishubmedan.id",
  "password": "LohParkir@2024",
  "role": "admin"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "message": "Akun admin Admin Baru berhasil dibuat",
  "data": {
    "id": "new-user-uuid",
    "nama": "Admin Baru",
    "email": "admin.baru@dishubmedan.id",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-06-02T14:00:00.000Z"
  }
}
```

**Response `409 Conflict`** — email sudah digunakan:

```json
{
  "success": false,
  "message": "Email admin.baru@dishubmedan.id sudah terdaftar"
}
```

---

### `POST /admin/emergency`

Tombol panik untuk petugas di lapangan. Mengirim alert darurat ke admin beserta koordinat GPS.

**Auth required:** Ya (`officer`)

**Request Body:**

```json
{
  "gpsLat": 3.5896,
  "gpsLng": 98.6789
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Alert darurat berhasil dikirim. Tim akan segera menghubungi Anda.",
  "data": {
    "alertId": "alert-uuid-here",
    "officerNama": "Budi Santoso",
    "gpsLat": 3.5896,
    "gpsLng": 98.6789,
    "sentAt": "2024-06-02T14:00:00.000Z"
  }
}
```

---

## 10. Error Responses

Seluruh error menggunakan struktur yang seragam:

```json
{
  "success": false,
  "message": "Deskripsi error yang dapat dipahami pengguna"
}
```

Beberapa error validasi menyertakan field `errors` berisi detail per field:

```json
{
  "success": false,
  "message": "Data yang dikirim tidak valid",
  "errors": [
    { "field": "email", "message": "Format email tidak valid" },
    { "field": "password", "message": "Password minimal 8 karakter" }
  ]
}
```

### Kode Status HTTP

| Status | Arti | Kapan terjadi |
|---|---|---|
| `200` | OK | Request berhasil |
| `201` | Created | Resource berhasil dibuat |
| `400` | Bad Request | Data tidak valid, field wajib kosong, atau format salah |
| `401` | Unauthorized | Token tidak ada, tidak valid, atau sudah kedaluwarsa |
| `403` | Forbidden | Token valid tetapi tidak punya izin untuk endpoint ini |
| `404` | Not Found | Resource dengan ID yang diminta tidak ditemukan |
| `409` | Conflict | Duplikasi data (NIP, email, idempotency key, dll.) |
| `429` | Too Many Requests | Melampaui batas rate limit |
| `500` | Internal Server Error | Kesalahan server yang tidak terduga |

---

## 11. Rate Limiting

| Endpoint | Limit | Scope |
|---|---|---|
| Semua endpoint | **100 request / menit** | Per IP address |
| `POST /auth/login` | **10 request / 15 menit** | Per IP address |
| `POST /reports` | **5 laporan / hari** | Per IP address |

Ketika limit terlampaui, server akan mengembalikan `429 Too Many Requests`:

```json
{
  "success": false,
  "message": "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat."
}
```

Response header yang disertakan saat rate limiting aktif:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1717340460
Retry-After: 42
```

---

## 12. Format QR Code

Format kode QR yang digunakan dalam sistem LohParkir:

```
LOHPARKIR-DSH-YYYY-NNN
```

| Segmen | Keterangan | Contoh |
|---|---|---|
| `LOHPARKIR` | Prefix sistem | tetap |
| `DSH` | Kode instansi Dishub Medan | tetap |
| `YYYY` | Tahun pembuatan QR code | `2024` |
| `NNN` | Nomor urut petugas (3 digit, zero-padded) | `001`, `042` |

**Contoh kode valid:**

- `LOHPARKIR-DSH-2024-001` — Petugas pertama tahun 2024
- `LOHPARKIR-DSH-2024-042` — Petugas ke-42 tahun 2024
- `LOHPARKIR-DSH-2025-001` — Petugas pertama tahun 2025

**Catatan:**
- Kode bersifat unik secara global dan tidak dapat digunakan ulang meski QR sudah dicabut.
- QR yang sudah dicabut (`revoked`) akan tetap mengembalikan response `hasil: "revoked"` saat di-scan, bukan `invalid`.

---

## 13. WebSocket Events

Koneksi real-time tersedia untuk admin dashboard.

**URL Koneksi:** `ws://localhost:3001`

Autentikasi menggunakan query parameter:

```
ws://localhost:3001?token=<accessToken>
```

### Events yang Diterima Client

| Event | Deskripsi | Role yang menerima |
|---|---|---|
| `SCAN_EVENT` | Ada QR code yang di-scan | `admin`, `superadmin` |
| `NEW_REPORT` | Laporan baru masuk | `admin`, `superadmin` |
| `REPORT_STATUS_CHANGED` | Status laporan diubah | `admin`, `superadmin` |
| `NEW_TRANSACTION` | Transaksi baru terbuat | `admin`, `superadmin` |
| `EMERGENCY_ALERT` | Petugas menekan tombol panik | `admin`, `superadmin` |

### Contoh Payload Event

**`SCAN_EVENT`:**

```json
{
  "event": "SCAN_EVENT",
  "data": {
    "scanId": "scan-uuid",
    "hasil": "valid",
    "kode": "LOHPARKIR-DSH-2024-001",
    "officerNama": "Budi Santoso",
    "gpsLat": 3.5896,
    "gpsLng": 98.6789,
    "timestamp": "2024-06-02T14:00:00.000Z"
  }
}
```

**`NEW_REPORT`:**

```json
{
  "event": "NEW_REPORT",
  "data": {
    "reportId": "rpt-uuid",
    "ticketNo": "RPT-20240602-00001",
    "status": "diterima",
    "alamatLokasi": "Jl. Pusat Pasar, Medan Kota",
    "timestamp": "2024-06-02T14:00:00.000Z"
  }
}
```

**`EMERGENCY_ALERT`:**

```json
{
  "event": "EMERGENCY_ALERT",
  "data": {
    "alertId": "alert-uuid",
    "officerId": "20000000-0000-0000-0000-000000000001",
    "officerNama": "Budi Santoso",
    "badgeNumber": "DSH-2024-001",
    "gpsLat": 3.5896,
    "gpsLng": 98.6789,
    "timestamp": "2024-06-02T14:00:00.000Z"
  }
}
```

---

*Dokumentasi ini dibuat untuk LohParkir v1 — Dinas Perhubungan Kota Medan.*  
*Untuk pertanyaan teknis, hubungi tim pengembang melalui repository internal.*
