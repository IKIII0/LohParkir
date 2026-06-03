-- =============================================================
-- LohParkir — Database Seed (PostgreSQL)
-- Seed: 001_seed.sql
-- Dinas Perhubungan Kota Medan
--
-- Jalankan SETELAH migration 001_init.sql berhasil.
-- Aman dijalankan ulang (ON CONFLICT DO NOTHING).
-- =============================================================

-- =============================================================
-- SECTION 1: USERS
-- 1 superadmin + 2 admin + 3 officer users
-- Password untuk semua akun: LohParkir@2024
-- Hash: $2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi
-- =============================================================

INSERT INTO users (id, role, nama, email, password_hash, is_active, created_at, updated_at)
VALUES

    -- Superadmin
    (
        'a1000000-0000-4000-8000-000000000001',
        'superadmin',
        'Super Administrator LohParkir',
        'superadmin@lohparkir.id',
        '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi',
        TRUE,
        NOW(),
        NOW()
    ),

    -- Admin 1
    (
        'a2000000-0000-4000-8000-000000000001',
        'admin',
        'Ahmad Fauzi',
        'admin1@dishubmedan.id',
        '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi',
        TRUE,
        NOW(),
        NOW()
    ),

    -- Admin 2
    (
        'a2000000-0000-4000-8000-000000000002',
        'admin',
        'Siti Rahayu',
        'admin2@dishubmedan.id',
        '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi',
        TRUE,
        NOW(),
        NOW()
    ),

    -- Officer 1 user record
    (
        'b1000000-0000-4000-8000-000000000001',
        'officer',
        'Budi Santoso',
        'petugas.budi@dishubmedan.id',
        '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi',
        TRUE,
        NOW(),
        NOW()
    ),

    -- Officer 2 user record
    (
        'b1000000-0000-4000-8000-000000000002',
        'officer',
        'Hendra Wijaya',
        'petugas.hendra@dishubmedan.id',
        '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi',
        TRUE,
        NOW(),
        NOW()
    ),

    -- Officer 3 user record
    (
        'b1000000-0000-4000-8000-000000000003',
        'officer',
        'Rizky Pratama',
        'petugas.rizky@dishubmedan.id',
        '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi',
        TRUE,
        NOW(),
        NOW()
    ),

    -- Public user (sample untuk scan & laporan)
    (
        'c1000000-0000-4000-8000-000000000001',
        'public',
        'Andi Kurniawan',
        'andi.kurniawan@gmail.com',
        '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi',
        TRUE,
        NOW(),
        NOW()
    ),

    -- Public user 2
    (
        'c1000000-0000-4000-8000-000000000002',
        'public',
        'Dewi Anggraini',
        'dewi.anggraini@yahoo.com',
        '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi',
        TRUE,
        NOW(),
        NOW()
    )

ON CONFLICT (email) DO NOTHING;


-- =============================================================
-- SECTION 2: PARKING ZONES
-- 5 zona parkir di area Kota Medan
-- Koordinat sekitar 3.5896°N, 98.6731°E (pusat Medan)
-- =============================================================

INSERT INTO parking_zones (id, nama, alamat, koordinat, kota, tarif_motor, tarif_mobil, is_active, created_at, updated_at)
VALUES

    -- Zona 1: Pusat perbelanjaan Merdeka Walk
    (
        'd1000000-0000-4000-8000-000000000001',
        'Zona Parkir Merdeka Walk',
        'Jl. Balai Kota No.1, Kesawan, Kec. Medan Barat, Kota Medan',
        POINT(3.5920, 98.6762),
        'Medan',
        2000.00,
        5000.00,
        TRUE,
        NOW(),
        NOW()
    ),

    -- Zona 2: Lapangan Merdeka
    (
        'd1000000-0000-4000-8000-000000000002',
        'Zona Parkir Lapangan Merdeka',
        'Jl. Balai Kota, Kesawan, Kec. Medan Barat, Kota Medan',
        POINT(3.5896, 98.6731),
        'Medan',
        2000.00,
        5000.00,
        TRUE,
        NOW(),
        NOW()
    ),

    -- Zona 3: Sun Plaza
    (
        'd1000000-0000-4000-8000-000000000003',
        'Zona Parkir Sun Plaza',
        'Jl. K.H. Zainul Arifin No.7, Petisah Tengah, Kec. Medan Petisah, Kota Medan',
        POINT(3.5952, 98.6710),
        'Medan',
        3000.00,
        7000.00,
        TRUE,
        NOW(),
        NOW()
    ),

    -- Zona 4: Pasar Petisah
    (
        'd1000000-0000-4000-8000-000000000004',
        'Zona Parkir Pasar Petisah',
        'Jl. Kota Baru No.14, Petisah Tengah, Kec. Medan Petisah, Kota Medan',
        POINT(3.5978, 98.6695),
        'Medan',
        2000.00,
        5000.00,
        TRUE,
        NOW(),
        NOW()
    ),

    -- Zona 5: Stasiun Medan
    (
        'd1000000-0000-4000-8000-000000000005',
        'Zona Parkir Stasiun Medan',
        'Jl. Stasiun Kereta Api No.1, Kesawan, Kec. Medan Barat, Kota Medan',
        POINT(3.5855, 98.6668),
        'Medan',
        2000.00,
        5000.00,
        TRUE,
        NOW(),
        NOW()
    )

ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- SECTION 3: OFFICERS
-- 3 petugas parkir resmi Dishub Medan
-- =============================================================

INSERT INTO officers (id, user_id, nip, nama, nomor_hp, zona_id, badge_number, status, created_at, updated_at)
VALUES

    -- Petugas 1 → Zona Merdeka Walk
    (
        'e1000000-0000-4000-8000-000000000001',
        'b1000000-0000-4000-8000-000000000001',
        '198501152010011001',
        'Budi Santoso',
        '081234567001',
        'd1000000-0000-4000-8000-000000000001',
        'DSH-2024-001',
        'aktif',
        NOW(),
        NOW()
    ),

    -- Petugas 2 → Zona Lapangan Merdeka
    (
        'e1000000-0000-4000-8000-000000000002',
        'b1000000-0000-4000-8000-000000000002',
        '198709232011021002',
        'Hendra Wijaya',
        '081234567002',
        'd1000000-0000-4000-8000-000000000002',
        'DSH-2024-002',
        'aktif',
        NOW(),
        NOW()
    ),

    -- Petugas 3 → Zona Sun Plaza
    (
        'e1000000-0000-4000-8000-000000000003',
        'b1000000-0000-4000-8000-000000000003',
        '199203052015031003',
        'Rizky Pratama',
        '081234567003',
        'd1000000-0000-4000-8000-000000000003',
        'DSH-2024-003',
        'aktif',
        NOW(),
        NOW()
    )

ON CONFLICT (nip) DO NOTHING;


-- =============================================================
-- SECTION 4: QR CODES
-- 1 QR code aktif per petugas
-- checksum = SHA-256 dari kode (disimulasikan dengan pgcrypto)
-- =============================================================

INSERT INTO qr_codes (id, officer_id, kode, checksum, status, generated_by, generated_at, created_at)
VALUES

    -- QR Petugas 1
    (
        'f1000000-0000-4000-8000-000000000001',
        'e1000000-0000-4000-8000-000000000001',
        'LOHPARKIR-DSH-2024-001',
        encode(digest('LOHPARKIR-DSH-2024-001', 'sha256'), 'hex'),
        'aktif',
        'a1000000-0000-4000-8000-000000000001',
        NOW(),
        NOW()
    ),

    -- QR Petugas 2
    (
        'f1000000-0000-4000-8000-000000000002',
        'e1000000-0000-4000-8000-000000000002',
        'LOHPARKIR-DSH-2024-002',
        encode(digest('LOHPARKIR-DSH-2024-002', 'sha256'), 'hex'),
        'aktif',
        'a1000000-0000-4000-8000-000000000001',
        NOW(),
        NOW()
    ),

    -- QR Petugas 3
    (
        'f1000000-0000-4000-8000-000000000003',
        'e1000000-0000-4000-8000-000000000003',
        'LOHPARKIR-DSH-2024-003',
        encode(digest('LOHPARKIR-DSH-2024-003', 'sha256'), 'hex'),
        'aktif',
        'a1000000-0000-4000-8000-000000000001',
        NOW(),
        NOW()
    ),

    -- QR revoked (contoh QR lama yang sudah dicabut)
    (
        'f1000000-0000-4000-8000-000000000099',
        'e1000000-0000-4000-8000-000000000001',
        'LOHPARKIR-DSH-2023-001',
        encode(digest('LOHPARKIR-DSH-2023-001', 'sha256'), 'hex'),
        'revoked',
        'a1000000-0000-4000-8000-000000000001',
        NOW() - INTERVAL '180 days',
        NOW() - INTERVAL '180 days'
    )

ON CONFLICT (kode) DO NOTHING;


-- =============================================================
-- SECTION 5: SCAN LOGS
-- Simulasi beberapa scan oleh masyarakat
-- =============================================================

INSERT INTO scan_logs (id, user_id, qr_code_id, kode_scanned, hasil_validasi, gps_lat, gps_lng, ip_address, user_agent, timestamp)
VALUES

    -- Scan valid oleh Andi (QR Petugas 1)
    (
        'e1000000-0000-4000-8000-000000000001',
        'c1000000-0000-4000-8000-000000000001',
        'f1000000-0000-4000-8000-000000000001',
        'LOHPARKIR-DSH-2024-001',
        'valid',
        3.59178,
        98.67598,
        '180.241.100.11',
        'Mozilla/5.0 (Android 13; Mobile) LohParkirApp/1.0',
        NOW() - INTERVAL '2 hours'
    ),

    -- Scan valid oleh Dewi (QR Petugas 2)
    (
        'e1000000-0000-4000-8000-000000000002',
        'c1000000-0000-4000-8000-000000000002',
        'f1000000-0000-4000-8000-000000000002',
        'LOHPARKIR-DSH-2024-002',
        'valid',
        3.58952,
        98.67312,
        '180.241.100.22',
        'Mozilla/5.0 (Android 12; Mobile) LohParkirApp/1.0',
        NOW() - INTERVAL '90 minutes'
    ),

    -- Scan valid oleh Andi (QR Petugas 3)
    (
        'e1000000-0000-4000-8000-000000000003',
        'c1000000-0000-4000-8000-000000000001',
        'f1000000-0000-4000-8000-000000000003',
        'LOHPARKIR-DSH-2024-003',
        'valid',
        3.59521,
        98.67103,
        '180.241.100.11',
        'Mozilla/5.0 (Android 13; Mobile) LohParkirApp/1.0',
        NOW() - INTERVAL '45 minutes'
    ),

    -- Scan invalid (kode tidak dikenal / QR palsu)
    (
        'e1000000-0000-4000-8000-000000000004',
        'c1000000-0000-4000-8000-000000000002',
        NULL,
        'LOHPARKIR-FAKE-9999',
        'invalid',
        3.58800,
        98.66900,
        '180.241.100.33',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17) LohParkirApp/1.0',
        NOW() - INTERVAL '30 minutes'
    ),

    -- Scan revoked (QR lama 2023 yang sudah dicabut)
    (
        'e1000000-0000-4000-8000-000000000005',
        'c1000000-0000-4000-8000-000000000001',
        'f1000000-0000-4000-8000-000000000099',
        'LOHPARKIR-DSH-2023-001',
        'revoked',
        3.59190,
        98.67610,
        '180.241.100.11',
        'Mozilla/5.0 (Android 13; Mobile) LohParkirApp/1.0',
        NOW() - INTERVAL '15 minutes'
    ),

    -- Scan valid kemarin (untuk historis)
    (
        'e1000000-0000-4000-8000-000000000006',
        'c1000000-0000-4000-8000-000000000002',
        'f1000000-0000-4000-8000-000000000001',
        'LOHPARKIR-DSH-2024-001',
        'valid',
        3.59182,
        98.67602,
        '180.241.100.22',
        'Mozilla/5.0 (Android 12; Mobile) LohParkirApp/1.0',
        NOW() - INTERVAL '1 day'
    ),

    -- Scan valid 2 hari lalu
    (
        'e1000000-0000-4000-8000-000000000007',
        NULL,
        'f1000000-0000-4000-8000-000000000002',
        'LOHPARKIR-DSH-2024-002',
        'valid',
        3.58960,
        98.67310,
        '114.125.80.55',
        'Mozilla/5.0 (Android 11; Mobile) LohParkirApp/1.0',
        NOW() - INTERVAL '2 days'
    )

ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- SECTION 6: REPORTS
-- Laporan parkir ilegal dari masyarakat
-- =============================================================

INSERT INTO reports (id, user_id, foto_url, deskripsi, gps_lat, gps_lng, alamat_lokasi, ticket_no, status, related_scan_id, created_at)
VALUES

    -- Laporan 1: diselesaikan
    (
        'd1000000-0000-4000-8000-000000000001',
        'c1000000-0000-4000-8000-000000000001',
        'https://storage.lohparkir.id/reports/RPT-20240601-00001/foto_01.jpg',
        'Motor parkir sembarangan di trotoar, menghalangi pejalan kaki. Petugas tidak terlihat di lokasi.',
        3.58800,
        98.66950,
        'Jl. Pemuda No.12, Kesawan, Medan Barat',
        'RPT-20240601-00001',
        'diselesaikan',
        NULL,
        NOW() - INTERVAL '5 days'
    ),

    -- Laporan 2: sedang diproses
    (
        'd-0000-4000-8000-000000000002',
        'c1000000-0000-4000-8000-000000000002',
        'https://storage.lohparkir.id/reports/RPT-20240603-00001/foto_01.jpg',
        'Mobil diparkir di depan pintu pemadam kebakaran selama berjam-jam. Tanpa tiket parkir resmi.',
        3.59450,
        98.67250,
        'Jl. Listrik No.5, Petisah Tengah, Medan Petisah',
        'RPT-20240603-00001',
        'sedang_diproses',
        'e1000000-0000-4000-8000-000000000004',
        NOW() - INTERVAL '3 days'
    ),

    -- Laporan 3: baru diterima (pending)
    (
        'd1000000-0000-4000-8000-000000000003',
        'c1000000-0000-4000-8000-000000000001',
        'https://storage.lohparkir.id/reports/RPT-20240605-00001/foto_01.jpg',
        'Petugas parkir liar meminta bayaran tanpa karcis resmi dan badge tidak terlihat.',
        3.59780,
        98.66980,
        'Jl. Kota Baru No.8, Petisah Tengah, Medan Petisah',
        'RPT-20240605-00001',
        'diterima',
        'e1000000-0000-4000-8000-000000000005',
        NOW() - INTERVAL '1 day'
    ),

    -- Laporan 4: ditolak (tidak memenuhi syarat)
    (
        'd1000000-0000-4000-8000-000000000004',
        'c1000000-0000-4000-8000-000000000002',
        'https://storage.lohparkir.id/reports/RPT-20240604-00001/foto_01.jpg',
        'Foto tidak jelas, tidak dapat diverifikasi lokasi dan identitas petugas.',
        3.58500,
        98.67100,
        'Jl. Asia No.3, Kesawan, Medan Barat',
        'RPT-20240604-00001',
        'ditolak',
        NULL,
        NOW() - INTERVAL '2 days'
    )

ON CONFLICT (ticket_no) DO NOTHING;


-- =============================================================
-- SECTION 7: REPORT LOGS
-- Log perubahan status laporan oleh admin
-- =============================================================

INSERT INTO report_logs (id, report_id, admin_id, status_lama, status_baru, catatan, timestamp)
VALUES

    -- Log untuk laporan 1: diterima → sedang_diproses → diselesaikan
    (
        'd-0000-4000-8000-000000000001',
        'd-0000-4000-8000-000000000001',
        'a2000000-0000-4000-8000-000000000001',
        'diterima',
        'sedang_diproses',
        'Laporan telah diverifikasi. Tim diturunkan ke lokasi untuk pengecekan.',
        NOW() - INTERVAL '4 days'
    ),
    (
        'd-0000-4000-8000-000000000002',
        'd-0000-4000-8000-000000000001',
        'a2000000-0000-4000-8000-000000000001',
        'sedang_diproses',
        'diselesaikan',
        'Petugas resmi telah ditugaskan ke lokasi. Trotoar sudah dibersihkan dari kendaraan liar.',
        NOW() - INTERVAL '3 days'
    ),

    -- Log untuk laporan 2: diterima → sedang_diproses
    (
        'd-0000-4000-8000-000000000003',
        'd-0000-4000-8000-000000000002',
        'a2000000-0000-4000-8000-000000000002',
        'diterima',
        'sedang_diproses',
        'Koordinasi dengan pihak UPTD Parkir Wilayah II. Investigasi sedang berjalan.',
        NOW() - INTERVAL '2 days'
    ),

    -- Log untuk laporan 4: diterima → ditolak
    (
        'd-0000-4000-8000-000000000004',
        'd-0000-4000-8000-000000000004',
        'a2000000-0000-4000-8000-000000000001',
        'diterima',
        'ditolak',
        'Foto terlalu gelap dan tidak memenuhi standar bukti. Pelapor disarankan mengulang dengan foto yang lebih jelas.',
        NOW() - INTERVAL '1 day'
    )

ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- SECTION 8: TRANSACTIONS
-- Transaksi pembayaran parkir (QRIS dan tunai)
-- =============================================================

INSERT INTO transactions (id, user_id, officer_id, zona_id, metode, nominal, status, idempotency_key, qris_ref, struk_url, created_at, updated_at)
VALUES

    -- Transaksi 1: QRIS berhasil, motor, Zona Merdeka Walk
    (
        'd-0000-4000-8000-000000000001',
        'c1000000-0000-4000-8000-000000000001',
        'e1000000-0000-4000-8000-000000000001',
        'd1000000-0000-4000-8000-000000000001',
        'qris',
        2000.00,
        'berhasil',
        'IDMP-20240601-ANK-001',
        'QRIS-REF-MWK-20240601-7821',
        'https://storage.lohparkir.id/struk/d-0000-4000-8000-000000000001.pdf',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days'
    ),

    -- Transaksi 2: tunai berhasil, mobil, Zona Lapangan Merdeka
    (
        'd-0000-4000-8000-000000000002',
        'c1000000-0000-4000-8000-000000000002',
        'e1000000-0000-4000-8000-000000000002',
        'd1000000-0000-4000-8000-000000000002',
        'tunai',
        5000.00,
        'berhasil',
        'IDMP-20240601-DEW-001',
        NULL,
        'https://storage.lohparkir.id/struk/d-0000-4000-8000-000000000002.pdf',
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '4 days'
    ),

    -- Transaksi 3: QRIS berhasil, motor, Zona Sun Plaza
    (
        'd-0000-4000-8000-000000000003',
        'c1000000-0000-4000-8000-000000000001',
        'e1000000-0000-4000-8000-000000000003',
        'd1000000-0000-4000-8000-000000000003',
        'qris',
        3000.00,
        'berhasil',
        'IDMP-20240602-ANK-001',
        'QRIS-REF-SPZ-20240602-3341',
        'https://storage.lohparkir.id/struk/d-0000-4000-8000-000000000003.pdf',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days'
    ),

    -- Transaksi 4: QRIS gagal (timeout gateway)
    (
        'd-0000-4000-8000-000000000004',
        'c1000000-0000-4000-8000-000000000002',
        'e1000000-0000-4000-8000-000000000001',
        'd1000000-0000-4000-8000-000000000001',
        'qris',
        2000.00,
        'gagal',
        'IDMP-20240603-DEW-001',
        NULL,
        NULL,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),

    -- Transaksi 5: tunai berhasil, motor, Zona Pasar Petisah
    (
        'd-0000-4000-8000-000000000005',
        NULL,
        'e1000000-0000-4000-8000-000000000002',
        'd1000000-0000-4000-8000-000000000004',
        'tunai',
        2000.00,
        'berhasil',
        'IDMP-20240604-HDR-001',
        NULL,
        'https://storage.lohparkir.id/struk/d-0000-4000-8000-000000000005.pdf',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    ),

    -- Transaksi 6: QRIS berhasil hari ini, mobil
    (
        'd-0000-4000-8000-000000000006',
        'c1000000-0000-4000-8000-000000000001',
        'e1000000-0000-4000-8000-000000000003',
        'd1000000-0000-4000-8000-000000000003',
        'qris',
        7000.00,
        'berhasil',
        'IDMP-20240606-ANK-001',
        'QRIS-REF-SPZ-20240606-9912',
        'https://storage.lohparkir.id/struk/d-0000-4000-8000-000000000006.pdf',
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours'
    ),

    -- Transaksi 7: tunai berhasil hari ini
    (
        'd-0000-4000-8000-000000000007',
        'c1000000-0000-4000-8000-000000000002',
        'e1000000-0000-4000-8000-000000000001',
        'd1000000-0000-4000-8000-000000000001',
        'tunai',
        2000.00,
        'berhasil',
        'IDMP-20240606-DEW-001',
        NULL,
        'https://storage.lohparkir.id/struk/d-0000-4000-8000-000000000007.pdf',
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '1 hour'
    )

ON CONFLICT (idempotency_key) DO NOTHING;


-- =============================================================
-- SECTION 9: NOTIFICATIONS
-- Notifikasi sistem untuk admin & user
-- =============================================================

INSERT INTO notifications (id, target_user_id, judul, pesan, tipe, priority, data_payload, is_read, created_at)
VALUES

    -- Notifikasi laporan baru → semua admin (target NULL = broadcast admin)
    (
        'd-0000-4000-8000-000000000001',
        NULL,
        'Laporan Baru Masuk',
        'Laporan parkir liar baru telah diterima (RPT-20240605-00001). Segera tindak lanjuti.',
        'laporan_baru',
        'high',
        '{"ticket_no": "RPT-20240605-00001", "report_id": "d-0000-4000-8000-000000000003"}',
        FALSE,
        NOW() - INTERVAL '1 day'
    ),

    -- Notifikasi status laporan → Andi (laporan 1 diselesaikan)
    (
        'd-0000-4000-8000-000000000002',
        'c1000000-0000-4000-8000-000000000001',
        'Laporan Anda Telah Diselesaikan',
        'Laporan parkir liar Anda (RPT-20240601-00001) telah diselesaikan oleh tim Dishub Medan. Terima kasih atas partisipasi Anda.',
        'laporan_status',
        'normal',
        '{"ticket_no": "RPT-20240601-00001", "status": "diselesaikan", "report_id": "d-0000-4000-8000-000000000001"}',
        TRUE,
        NOW() - INTERVAL '3 days'
    ),

    -- Notifikasi status laporan → Dewi (laporan 4 ditolak)
    (
        'd-0000-4000-8000-000000000003',
        'c1000000-0000-4000-8000-000000000002',
        'Laporan Anda Ditolak',
        'Laporan Anda (RPT-20240604-00001) tidak dapat diproses karena foto bukti tidak memenuhi standar. Silakan coba kembali dengan foto yang lebih jelas.',
        'laporan_status',
        'normal',
        '{"ticket_no": "RPT-20240604-00001", "status": "ditolak", "report_id": "d-0000-4000-8000-000000000004"}',
        FALSE,
        NOW() - INTERVAL '1 day'
    ),

    -- Notifikasi sistem → superadmin
    (
        'd-0000-4000-8000-000000000004',
        'a1000000-0000-4000-8000-000000000001',
        'Sistem Berjalan Normal',
        'Seeding data awal berhasil dilakukan. Sistem LohParkir siap digunakan.',
        'system',
        'normal',
        '{"version": "1.0.0", "env": "development"}',
        FALSE,
        NOW()
    )

ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- SECTION 10: AUDIT TRAIL
-- Log aksi sensitif dari superadmin dan admin
-- =============================================================

INSERT INTO audit_trail (id, user_id, aksi, entitas, entitas_id, data_lama, data_baru, ip_address, timestamp)
VALUES

    -- Superadmin membuat Admin 1
    (
        'd-0000-4000-8000-000000000001',
        'a1000000-0000-4000-8000-000000000001',
        'CREATE_USER',
        'users',
        'a2000000-0000-4000-8000-000000000001',
        NULL,
        '{"role": "admin", "email": "admin1@dishubmedan.id", "nama": "Ahmad Fauzi"}',
        '127.0.0.1',
        NOW() - INTERVAL '30 days'
    ),

    -- Superadmin membuat Admin 2
    (
        'd-0000-4000-8000-000000000002',
        'a1000000-0000-4000-8000-000000000001',
        'CREATE_USER',
        'users',
        'a2000000-0000-4000-8000-000000000002',
        NULL,
        '{"role": "admin", "email": "admin2@dishubmedan.id", "nama": "Siti Rahayu"}',
        '127.0.0.1',
        NOW() - INTERVAL '30 days'
    ),

    -- Admin 1 mendaftarkan Petugas 1
    (
        'd-0000-4000-8000-000000000003',
        'a2000000-0000-4000-8000-000000000001',
        'CREATE_OFFICER',
        'officers',
        'e1000000-0000-4000-8000-000000000001',
        NULL,
        '{"nip": "198501152010011001", "badge_number": "DSH-2024-001", "nama": "Budi Santoso"}',
        '192.168.1.10',
        NOW() - INTERVAL '20 days'
    ),

    -- Admin 1 generate QR untuk Petugas 1
    (
        'd-0000-4000-8000-000000000004',
        'a2000000-0000-4000-8000-000000000001',
        'CREATE_QR',
        'qr_codes',
        'f1000000-0000-4000-8000-000000000001',
        NULL,
        '{"kode": "LOHPARKIR-DSH-2024-001", "officer_id": "e1000000-0000-4000-8000-000000000001"}',
        '192.168.1.10',
        NOW() - INTERVAL '20 days'
    ),

    -- Admin 1 mencabut QR lama
    (
        'd-0000-4000-8000-000000000005',
        'a2000000-0000-4000-8000-000000000001',
        'REVOKE_QR',
        'qr_codes',
        'f1000000-0000-4000-8000-000000000099',
        '{"status": "aktif"}',
        '{"status": "revoked", "revoked_at": "2024-01-01T00:00:00Z"}',
        '192.168.1.10',
        NOW() - INTERVAL '180 days'
    )

ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- SECTION 11: RATE LIMIT TRACKER
-- Contoh data rate limiting harian
-- =============================================================

INSERT INTO rate_limit_tracker (identifier, aksi, tanggal, count)
VALUES
    ('c1000000-0000-4000-8000-000000000001', 'submit_report', CURRENT_DATE, 2),
    ('c1000000-0000-4000-8000-000000000002', 'submit_report', CURRENT_DATE, 1),
    ('180.241.100.33',                        'submit_report', CURRENT_DATE, 1)
ON CONFLICT (identifier, aksi, tanggal) DO NOTHING;


-- =============================================================
-- VERIFICATION QUERY (opsional, bisa di-comment)
-- Jalankan untuk memverifikasi jumlah data yang berhasil di-seed
-- =============================================================

DO $$
DECLARE
    v_users        INT;
    v_zones        INT;
    v_officers     INT;
    v_qr_codes     INT;
    v_scan_logs    INT;
    v_reports      INT;
    v_transactions INT;
BEGIN
    SELECT COUNT(*) INTO v_users        FROM users;
    SELECT COUNT(*) INTO v_zones        FROM parking_zones;
    SELECT COUNT(*) INTO v_officers     FROM officers;
    SELECT COUNT(*) INTO v_qr_codes     FROM qr_codes;
    SELECT COUNT(*) INTO v_scan_logs    FROM scan_logs;
    SELECT COUNT(*) INTO v_reports      FROM reports;
    SELECT COUNT(*) INTO v_transactions FROM transactions;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'LohParkir Seed Verification';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'users        : %', v_users;
    RAISE NOTICE 'parking_zones: %', v_zones;
    RAISE NOTICE 'officers     : %', v_officers;
    RAISE NOTICE 'qr_codes     : %', v_qr_codes;
    RAISE NOTICE 'scan_logs    : %', v_scan_logs;
    RAISE NOTICE 'reports      : %', v_reports;
    RAISE NOTICE 'transactions : %', v_transactions;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Seed selesai. Semua data berhasil dimuat.';
    RAISE NOTICE '========================================';
END $$;
