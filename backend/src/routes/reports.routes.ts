import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { reportLimiter } from '../middleware/rateLimiter';
import { generateTicketNumber, encryptData } from '../services/qr.service';
import { sendNotification } from '../services/notification.service';
import { logAudit } from '../services/audit.service';
import { wsBroadcast } from '../config/websocket';
import { env } from '../config/env';

const router = Router();

// Multer config untuk upload foto
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `report-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'));
    }
  },
});

// ─── GET /api/v1/reports — List laporan (admin) ───────────────────────────────
router.get('/', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status) { conditions.push(`r.status = $${idx++}`); params.push(status); }
  if (startDate) { conditions.push(`r.created_at >= $${idx++}`); params.push(startDate); }
  if (endDate) { conditions.push(`r.created_at <= $${idx++}`); params.push(endDate + 'T23:59:59Z'); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT r.id, r.ticket_no, r.deskripsi, r.gps_lat, r.gps_lng,
            r.alamat_lokasi, r.status, r.foto_url, r.created_at, r.referensi_tiket
     FROM reports r
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, Number(limit), offset]
  );

  const countResult = await pool.query(`SELECT COUNT(*) FROM reports r ${where}`, params);

  res.json({
    success: true,
    data: result.rows,
    total: parseInt(countResult.rows[0].count),
    page: Number(page),
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit)),
  });
}));

// ─── POST /api/v1/reports — Submit laporan baru (public) ─────────────────────
router.post('/', reportLimiter, upload.single('foto'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw createError('Foto bukti wajib disertakan', 400);

  const { deskripsi, gpsLat, gpsLng, alamatLokasi, relatedScanId, referensiTiket } = req.body;

  if (!gpsLat || !gpsLng) throw createError('Lokasi GPS wajib disertakan', 400);

  const userId = (req as any).user?.userId || null;
  const fotoUrl = `/uploads/${req.file.filename}`;
  const ticketNo = generateTicketNumber();

  // Enkripsi identitas pelapor
  const userIdEnc = userId ? encryptData(userId) : encryptData(req.ip || 'anonim');

  const result = await pool.query(
    `INSERT INTO reports (user_id, user_id_enc, foto_url, deskripsi, gps_lat, gps_lng, alamat_lokasi, ticket_no, status, related_scan_id, referensi_tiket)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'diterima', $9, $10)
     RETURNING id, ticket_no, status, created_at`,
    [
      userId, userIdEnc, fotoUrl,
      deskripsi || null,
      parseFloat(gpsLat), parseFloat(gpsLng),
      alamatLokasi || null, ticketNo,
      relatedScanId || null, referensiTiket || null,
    ]
  );

  const report = result.rows[0];

  // Notifikasi ke semua admin
  await sendNotification({
    judul: '📋 Laporan Baru Masuk',
    pesan: `Laporan baru diterima — No. Tiket: ${ticketNo}`,
    tipe: 'laporan_baru',
    dataPayload: { reportId: report.id, ticketNo },
  });

  // Broadcast ke dashboard
  wsBroadcast('NEW_REPORT', { reportId: report.id, ticketNo, status: 'diterima' });

  res.status(201).json({
    success: true,
    message: 'Laporan berhasil dikirim. Nomor tiket Anda tersimpan untuk pelacakan status.',
    data: {
      reportId: report.id,
      ticketNo: report.ticket_no,
      status: report.status,
      createdAt: report.created_at,
    },
  });
}));

// ─── GET /api/v1/reports/track/:ticketNo — Cek status laporan (public) ───────
router.get('/track/:ticketNo', asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT r.ticket_no, r.status, r.created_at,
            (SELECT json_agg(json_build_object(
              'status_baru', rl.status_baru,
              'catatan', rl.catatan,
              'timestamp', rl.timestamp
            ) ORDER BY rl.timestamp)
             FROM report_logs rl WHERE rl.report_id = r.id) AS log_history
     FROM reports r
     WHERE r.ticket_no = $1`,
    [req.params.ticketNo]
  );
  if (!result.rows[0]) throw createError('Nomor tiket tidak ditemukan', 404);
  res.json({ success: true, data: result.rows[0] });
}));

// ─── GET /api/v1/reports/:id — Detail laporan (admin) ────────────────────────
router.get('/:id', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT r.*,
            (SELECT json_agg(json_build_object(
              'status_lama', rl.status_lama,
              'status_baru', rl.status_baru,
              'catatan', rl.catatan,
              'admin_id', rl.admin_id,
              'timestamp', rl.timestamp
            ) ORDER BY rl.timestamp)
             FROM report_logs rl WHERE rl.report_id = r.id) AS log_history
     FROM reports r
     WHERE r.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) throw createError('Laporan tidak ditemukan', 404);
  res.json({ success: true, data: result.rows[0] });
}));

// ─── PATCH /api/v1/reports/:id/status — Update status laporan (admin) ─────────
router.patch('/:id/status', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { status, catatan } = req.body;
  const validStatuses = ['sedang_diproses', 'diselesaikan', 'ditolak'];

  if (!status || !validStatuses.includes(status)) {
    throw createError(`Status tidak valid. Pilih: ${validStatuses.join(', ')}`, 400);
  }

  const report = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
  if (!report.rows[0]) throw createError('Laporan tidak ditemukan', 404);

  const oldStatus = report.rows[0].status;

  // Update status
  await pool.query('UPDATE reports SET status = $1 WHERE id = $2', [status, req.params.id]);

  // Catat log
  await pool.query(
    `INSERT INTO report_logs (report_id, admin_id, status_lama, status_baru, catatan)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.params.id, req.user!.userId, oldStatus, status, catatan || null]
  );

  // Notifikasi ke pelapor (jika ada)
  if (report.rows[0].user_id) {
    const statusMap: Record<string, string> = {
      sedang_diproses: 'Sedang Diproses',
      diselesaikan: 'Diselesaikan',
      ditolak: 'Ditolak',
    };
    const statusLabel = statusMap[status] || status;

    await sendNotification({
      targetUserId: report.rows[0].user_id,
      judul: '📋 Status Laporan Diperbarui',
      pesan: `Laporan No. ${report.rows[0].ticket_no} — Status: ${statusLabel}${catatan ? `. ${catatan}` : ''}`,
      tipe: 'laporan_status',
      dataPayload: { reportId: req.params.id, ticketNo: report.rows[0].ticket_no, status },
    });
  }

  wsBroadcast('REPORT_STATUS_CHANGED', { reportId: req.params.id, status });

  await logAudit({
    userId: req.user!.userId,
    aksi: 'UPDATE_REPORT_STATUS',
    entitas: 'reports',
    entitasId: req.params.id,
    dataLama: { status: oldStatus },
    dataBaru: { status, catatan },
  });

  res.json({ success: true, message: 'Status laporan berhasil diperbarui', data: { status } });
}));

export default router;
