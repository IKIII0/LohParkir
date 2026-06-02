-- =============================================================
-- LohParkir — Database Schema (PostgreSQL)
-- Migration: 001_init.sql
-- Dinas Perhubungan Kota Medan
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- TABLE: users
-- Semua akun: public, officer, admin, superadmin
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role            VARCHAR(20) NOT NULL CHECK (role IN ('public','officer','admin','superadmin')),
    nama            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT,
    fcm_token       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- =============================================================
-- TABLE: parking_zones
-- Zona/area parkir yang dikelola Dishub
-- =============================================================
CREATE TABLE IF NOT EXISTS parking_zones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama        VARCHAR(255) NOT NULL,
    alamat      TEXT,
    koordinat   POINT,                       -- lat,lng
    kota        VARCHAR(100) NOT NULL DEFAULT 'Medan',
    tarif_motor NUMERIC(10,2) NOT NULL DEFAULT 2000,
    tarif_mobil NUMERIC(10,2) NOT NULL DEFAULT 5000,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_active ON parking_zones(is_active);

-- =============================================================
-- TABLE: officers
-- Petugas parkir resmi yang didaftarkan Admin Dishub
-- =============================================================
CREATE TABLE IF NOT EXISTS officers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    nip             VARCHAR(50) UNIQUE NOT NULL,
    nama            VARCHAR(255) NOT NULL,
    nomor_hp        VARCHAR(20),
    zona_id         UUID REFERENCES parking_zones(id) ON DELETE SET NULL,
    badge_number    VARCHAR(30) UNIQUE NOT NULL,  -- e.g. DSH-2024-001
    status          VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif','suspended')),
    foto_url        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_officers_user_id ON officers(user_id);
CREATE INDEX idx_officers_nip     ON officers(nip);
CREATE INDEX idx_officers_status  ON officers(status);

-- =============================================================
-- TABLE: qr_codes
-- QR Code unik per petugas. Format: LOHPARKIR-DSH-YYYY-NNN
-- =============================================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    officer_id      UUID NOT NULL REFERENCES officers(id) ON DELETE RESTRICT,
    kode            VARCHAR(50) UNIQUE NOT NULL,   -- LOHPARKIR-DSH-2024-001
    checksum        VARCHAR(64) NOT NULL,           -- SHA-256 checksum
    status          VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif','revoked')),
    generated_by    UUID REFERENCES users(id),
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qrcodes_officer ON qr_codes(officer_id);
CREATE INDEX idx_qrcodes_kode    ON qr_codes(kode);
CREATE INDEX idx_qrcodes_status  ON qr_codes(status);

-- =============================================================
-- TABLE: scan_logs
-- Log setiap kali user scan QR code
-- =============================================================
CREATE TABLE IF NOT EXISTS scan_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,   -- NULL jika tidak login
    qr_code_id      UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    kode_scanned    VARCHAR(100) NOT NULL,   -- raw string yang di-scan
    hasil_validasi  VARCHAR(20) NOT NULL CHECK (hasil_validasi IN ('valid','invalid','revoked','network_error')),
    gps_lat         DECIMAL(10,8),
    gps_lng         DECIMAL(11,8),
    ip_address      INET,
    user_agent      TEXT,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scanlogs_timestamp    ON scan_logs(timestamp);
CREATE INDEX idx_scanlogs_qr_code      ON scan_logs(qr_code_id);
CREATE INDEX idx_scanlogs_hasil        ON scan_logs(hasil_validasi);

-- =============================================================
-- TABLE: reports
-- Laporan parkir ilegal dari masyarakat
-- =============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,   -- NULL jika anonim
    user_id_enc     TEXT,                   -- identitas pelapor dienkripsi (AES-256)
    foto_url        TEXT NOT NULL,
    deskripsi       TEXT,
    gps_lat         DECIMAL(10,8) NOT NULL,
    gps_lng         DECIMAL(11,8) NOT NULL,
    alamat_lokasi   TEXT,
    ticket_no       VARCHAR(30) UNIQUE NOT NULL,   -- e.g. RPT-20240101-00001
    status          VARCHAR(30) NOT NULL DEFAULT 'diterima'
                        CHECK (status IN ('diterima','sedang_diproses','diselesaikan','ditolak')),
    related_scan_id UUID REFERENCES scan_logs(id) ON DELETE SET NULL,
    referensi_tiket VARCHAR(30),            -- tiket laporan sebelumnya (jika referensi)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- NOTE: immutable setelah submit (no updated_at)
);

CREATE INDEX idx_reports_status     ON reports(status);
CREATE INDEX idx_reports_ticket     ON reports(ticket_no);
CREATE INDEX idx_reports_created    ON reports(created_at);
CREATE INDEX idx_reports_gps        ON reports(gps_lat, gps_lng);

-- =============================================================
-- TABLE: report_logs
-- Log perubahan status laporan oleh admin
-- =============================================================
CREATE TABLE IF NOT EXISTS report_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE RESTRICT,
    admin_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status_lama VARCHAR(30),
    status_baru VARCHAR(30) NOT NULL,
    catatan     TEXT,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rptlogs_report_id ON report_logs(report_id);
CREATE INDEX idx_rptlogs_timestamp ON report_logs(timestamp);

-- =============================================================
-- TABLE: transactions
-- Transaksi pembayaran (QRIS atau tunai)
-- =============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    officer_id          UUID REFERENCES officers(id) ON DELETE SET NULL,
    zona_id             UUID REFERENCES parking_zones(id) ON DELETE SET NULL,
    metode              VARCHAR(20) NOT NULL CHECK (metode IN ('qris','tunai')),
    nominal             NUMERIC(12,2) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','berhasil','gagal','refunded')),
    idempotency_key     VARCHAR(128) UNIQUE NOT NULL,
    qris_ref            VARCHAR(255),           -- referensi dari payment gateway
    payment_url         TEXT,                   -- URL QRIS untuk ditampilkan
    refund_at           TIMESTAMPTZ,
    struk_url           TEXT,                   -- URL PDF struk digital
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tx_user_id         ON transactions(user_id);
CREATE INDEX idx_tx_officer_id      ON transactions(officer_id);
CREATE INDEX idx_tx_status          ON transactions(status);
CREATE INDEX idx_tx_created         ON transactions(created_at);
CREATE INDEX idx_tx_idempotency     ON transactions(idempotency_key);

-- =============================================================
-- TABLE: notifications
-- Push notifications untuk user & admin
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id  UUID REFERENCES users(id) ON DELETE CASCADE,   -- NULL = broadcast semua admin
    pesan           TEXT NOT NULL,
    judul           VARCHAR(255),
    tipe            VARCHAR(30) NOT NULL CHECK (tipe IN ('laporan_status','laporan_baru','emergency','system')),
    priority        VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','high')),
    data_payload    JSONB,                  -- data tambahan (mis. report_id, officer_id)
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_target   ON notifications(target_user_id);
CREATE INDEX idx_notif_is_read  ON notifications(is_read);
CREATE INDEX idx_notif_tipe     ON notifications(tipe);
CREATE INDEX idx_notif_created  ON notifications(created_at);

-- =============================================================
-- TABLE: audit_trail
-- Log semua aksi superadmin dan aksi sensitif
-- =============================================================
CREATE TABLE IF NOT EXISTS audit_trail (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    aksi        VARCHAR(100) NOT NULL,   -- e.g. 'CREATE_OFFICER', 'DELETE_QR', 'UPDATE_ROLE'
    entitas     VARCHAR(100),            -- tabel/entitas yang terpengaruh
    entitas_id  UUID,                   -- ID record yang terpengaruh
    data_lama   JSONB,
    data_baru   JSONB,
    ip_address  INET,
    user_agent  TEXT,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id   ON audit_trail(user_id);
CREATE INDEX idx_audit_timestamp ON audit_trail(timestamp);
CREATE INDEX idx_audit_aksi      ON audit_trail(aksi);
CREATE INDEX idx_audit_entitas   ON audit_trail(entitas);

-- =============================================================
-- TABLE: rate_limit_tracker
-- Rate limiting 5 laporan/hari per user
-- =============================================================
CREATE TABLE IF NOT EXISTS rate_limit_tracker (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier  VARCHAR(255) NOT NULL,   -- user_id atau IP
    aksi        VARCHAR(50) NOT NULL,    -- e.g. 'submit_report'
    tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
    count       INTEGER NOT NULL DEFAULT 1,
    UNIQUE (identifier, aksi, tanggal)
);

-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_officers_updated_at
    BEFORE UPDATE ON officers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_zones_updated_at
    BEFORE UPDATE ON parking_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tx_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate ticket number for reports
CREATE OR REPLACE FUNCTION generate_ticket_no()
RETURNS TEXT AS $$
DECLARE
    seq INT;
    today TEXT;
BEGIN
    today := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_no FROM 13) AS INT)), 0) + 1
    INTO seq
    FROM reports
    WHERE ticket_no LIKE 'RPT-' || today || '-%';
    RETURN 'RPT-' || today || '-' || LPAD(seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- VIEWS
-- =============================================================

-- View untuk dashboard: statistik hari ini
CREATE OR REPLACE VIEW dashboard_stats_today AS
SELECT
    (SELECT COUNT(*) FROM scan_logs WHERE timestamp::DATE = CURRENT_DATE) AS total_scan_hari_ini,
    (SELECT COUNT(*) FROM scan_logs WHERE timestamp::DATE = CURRENT_DATE AND hasil_validasi = 'valid') AS scan_valid,
    (SELECT COUNT(*) FROM scan_logs WHERE timestamp::DATE = CURRENT_DATE AND hasil_validasi = 'invalid') AS scan_invalid,
    (SELECT COUNT(*) FROM qr_codes WHERE status = 'aktif') AS total_qr_aktif,
    (SELECT COUNT(*) FROM reports WHERE created_at::DATE = CURRENT_DATE) AS laporan_hari_ini,
    (SELECT COUNT(*) FROM reports WHERE status = 'diterima') AS laporan_pending,
    (SELECT COALESCE(SUM(nominal), 0) FROM transactions WHERE created_at::DATE = CURRENT_DATE AND status = 'berhasil') AS pendapatan_hari_ini,
    (SELECT COALESCE(SUM(nominal), 0) FROM transactions WHERE created_at::DATE = CURRENT_DATE AND status = 'berhasil' AND metode = 'qris') AS pendapatan_qris,
    (SELECT COALESCE(SUM(nominal), 0) FROM transactions WHERE created_at::DATE = CURRENT_DATE AND status = 'berhasil' AND metode = 'tunai') AS pendapatan_tunai;
