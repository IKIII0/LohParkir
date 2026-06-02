import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { pool, withTransaction } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import {
  validateQrFormat,
  generateQrCodeString,
  generateChecksum,
} from '../services/qr.service';
import { logAudit } from '../services/audit.service';
import { wsBroadcast } from '../config/websocket';

const router = Router();

// ─── POST /api/v1/qr/validate — Validasi QR Code (public) ────────────────────
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { kode, gpsLat, gpsLng } = req.body;

  if (!kode) throw createError('Kode QR diperlukan', 400);

  const userId = (req as any).user?.userId || null;
  let hasilValidasi: 'valid' | 'invalid' | 'revoked' = 'invalid';
  let officerData = null;

  // Validasi format terlebih dahulu
  if (!validateQrFormat(kode)) {
    // Simpan scan log
    await pool.query(
      `INSERT INTO scan_logs (user_id, kode_scanned, hasil_validasi, gps_lat, gps_lng, ip_address)
       VALUES ($1, $2, 'invalid', $3, $4, $5)`,
      [userId, kode, gpsLat || null, gpsLng || null, req.ip]
    );

    // Broadcast ke dashboard
    wsBroadcast('SCAN_EVENT', { hasil: 'invalid', kode, gps: { lat: gpsLat, lng: gpsLng } });

    return res.json({
      success: true,
      valid: false,
      hasil: 'invalid',
      pesan: 'QR Code tidak terdaftar dalam sistem Dishub Medan',
    });
  }

  // Cari di database
  const qrResult = await pool.query(
    `SELECT qr.*, o.nama AS officer_nama, o.nip, o.badge_number, o.status AS officer_status,
            pz.nama AS zona_nama, pz.tarif_motor, pz.tarif_mobil, pz.alamat AS zona_alamat
     FROM qr_codes qr
     JOIN officers o ON qr.officer_id = o.id
     LEFT JOIN parking_zones pz ON o.zona_id = pz.id
     WHERE qr.kode = $1`,
    [kode]
  );

  if (!qrResult.rows[0]) {
    hasilValidasi = 'invalid';
  } else {
    const qr = qrResult.rows[0];
    if (qr.status === 'revoked') {
      hasilValidasi = 'revoked';
    } else if (qr.status === 'aktif' && qr.officer_status === 'aktif') {
      hasilValidasi = 'valid';
      officerData = {
        officerId: qr.officer_id,
        qrCodeId: qr.id,
        namaPetugas: qr.officer_nama,
        nip: qr.nip,
        badgeNumber: qr.badge_number,
        statusPetugas: qr.officer_status,
        zona: {
          nama: qr.zona_nama,
          alamat: qr.zona_alamat,
          tarifMotor: qr.tarif_motor,
          tarifMobil: qr.tarif_mobil,
        },
      };
    } else {
      hasilValidasi = 'invalid';
    }
  }

  // Simpan scan log
  const scanLog = await pool.query(
    `INSERT INTO scan_logs (user_id, qr_code_id, kode_scanned, hasil_validasi, gps_lat, gps_lng, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      userId,
      qrResult.rows[0]?.id || null,
      kode,
      hasilValidasi,
      gpsLat || null,
      gpsLng || null,
      req.ip,
    ]
  );

  // Broadcast ke dashboard real-time
  wsBroadcast('SCAN_EVENT', {
    hasil: hasilValidasi,
    kode,
    gps: { lat: gpsLat, lng: gpsLng },
    timestamp: new Date().toISOString(),
  });

  if (hasilValidasi === 'valid') {
    return res.json({
      success: true,
      valid: true,
      hasil: 'valid',
      pesan: 'QR Code valid — Petugas resmi Dishub Medan',
      data: officerData,
      scanId: scanLog.rows[0].id,
    });
  }

  const pesan =
    hasilValidasi === 'revoked'
      ? 'QR Code ini telah dicabut dan tidak berlaku lagi'
      : 'QR Code tidak terdaftar dalam sistem Dishub Medan';

  res.json({
    success: true,
    valid: false,
    hasil: hasilValidasi,
    pesan,
    scanId: scanLog.rows[0].id,
  });
}));

// ─── POST /api/v1/qr/generate — Generate QR Code baru (admin) ─────────────────
router.post('/generate', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { officerId } = req.body;
  if (!officerId) throw createError('Officer ID diperlukan', 400);

  // Cek officer ada
  const officerResult = await pool.query(
    'SELECT id, badge_number, nama FROM officers WHERE id = $1',
    [officerId]
  );
  if (!officerResult.rows[0]) throw createError('Petugas tidak ditemukan', 404);

  const officer = officerResult.rows[0];

  // Ambil tahun dan sequence berikutnya
  const year = new Date().getFullYear();
  const seqResult = await pool.query(
    `SELECT COUNT(*) AS count FROM qr_codes WHERE kode LIKE $1`,
    [`LOHPARKIR-DSH-${year}-%`]
  );
  const seq = parseInt(seqResult.rows[0].count) + 1;

  const kode = generateQrCodeString(year, seq);
  const checksum = generateChecksum(kode);

  // Nonaktifkan QR lama officer ini
  await pool.query(
    `UPDATE qr_codes SET status = 'revoked', revoked_at = NOW() WHERE officer_id = $1 AND status = 'aktif'`,
    [officerId]
  );

  // Buat QR baru
  const newQr = await pool.query(
    `INSERT INTO qr_codes (officer_id, kode, checksum, status, generated_by)
     VALUES ($1, $2, $3, 'aktif', $4)
     RETURNING *`,
    [officerId, kode, checksum, req.user!.userId]
  );

  // Generate QR image sebagai Data URL
  const qrImageDataUrl = await QRCode.toDataURL(kode, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H',
  });

  await logAudit({
    userId: req.user!.userId,
    aksi: 'GENERATE_QR',
    entitas: 'qr_codes',
    entitasId: newQr.rows[0].id,
    dataBaru: { kode, officerId, officerNama: officer.nama },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'QR Code berhasil dibuat',
    data: {
      ...newQr.rows[0],
      qrImageDataUrl,
    },
  });
}));

// ─── GET /api/v1/qr/:id — Detail QR Code (admin) ─────────────────────────────
router.get('/:id', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT qr.*, o.nama AS officer_nama, o.badge_number, o.status AS officer_status
     FROM qr_codes qr
     JOIN officers o ON qr.officer_id = o.id
     WHERE qr.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) throw createError('QR Code tidak ditemukan', 404);
  res.json({ success: true, data: result.rows[0] });
}));

// ─── DELETE /api/v1/qr/:id/revoke — Cabut QR Code (superadmin) ───────────────
router.delete('/:id/revoke', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!['admin', 'superadmin'].includes(req.user!.role)) {
    throw createError('Tidak memiliki izin', 403);
  }

  const qr = await pool.query('SELECT * FROM qr_codes WHERE id = $1', [req.params.id]);
  if (!qr.rows[0]) throw createError('QR Code tidak ditemukan', 404);

  await pool.query(
    `UPDATE qr_codes SET status = 'revoked', revoked_at = NOW() WHERE id = $1`,
    [req.params.id]
  );

  await logAudit({
    userId: req.user!.userId,
    aksi: 'REVOKE_QR',
    entitas: 'qr_codes',
    entitasId: req.params.id,
    dataLama: { status: qr.rows[0].status },
    dataBaru: { status: 'revoked' },
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'QR Code berhasil dicabut' });
}));

export default router;
