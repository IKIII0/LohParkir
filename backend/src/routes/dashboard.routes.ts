import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

// ─── GET /api/v1/dashboard/stats — Statistik hari ini ────────────────────────
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM dashboard_stats_today');
  res.json({ success: true, data: result.rows[0] });
}));

// ─── GET /api/v1/dashboard/trend — Tren harian 30 hari ───────────────────────
router.get('/trend', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { period = 'daily', days = 30 } = req.query;

  const result = await pool.query(
    `SELECT
       DATE_TRUNC($1, sl.timestamp) AS periode,
       COUNT(*) AS total_scan,
       SUM(CASE WHEN sl.hasil_validasi = 'valid' THEN 1 ELSE 0 END) AS scan_valid,
       SUM(CASE WHEN sl.hasil_validasi = 'invalid' THEN 1 ELSE 0 END) AS scan_invalid
     FROM scan_logs sl
     WHERE sl.timestamp >= NOW() - INTERVAL '${Number(days)} days'
     GROUP BY 1
     ORDER BY 1`,
    [period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day']
  );

  res.json({ success: true, data: result.rows });
}));

// ─── GET /api/v1/dashboard/revenue — Pendapatan per periode ──────────────────
router.get('/revenue', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { days = 30 } = req.query;

  const result = await pool.query(
    `SELECT
       DATE_TRUNC('day', created_at) AS tanggal,
       SUM(CASE WHEN metode = 'qris' THEN nominal ELSE 0 END) AS total_qris,
       SUM(CASE WHEN metode = 'tunai' THEN nominal ELSE 0 END) AS total_tunai,
       SUM(nominal) AS total
     FROM transactions
     WHERE status = 'berhasil' AND created_at >= NOW() - INTERVAL '${Number(days)} days'
     GROUP BY 1
     ORDER BY 1`,
    []
  );

  res.json({ success: true, data: result.rows });
}));

// ─── GET /api/v1/dashboard/heatmap — Data lokasi scan untuk heatmap ──────────
router.get('/heatmap', asyncHandler(async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT gps_lat AS lat, gps_lng AS lng, hasil_validasi,
            COUNT(*) AS count
     FROM scan_logs
     WHERE gps_lat IS NOT NULL AND gps_lng IS NOT NULL
       AND timestamp >= NOW() - INTERVAL '7 days'
     GROUP BY gps_lat, gps_lng, hasil_validasi
     LIMIT 500`
  );

  res.json({ success: true, data: result.rows });
}));

// ─── GET /api/v1/dashboard/public — Statistik publik (tanpa login) ────────────
router.get('/public', asyncHandler(async (_req: Request, res: Response) => {
  const [scans, zones, reports, officers] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM scan_logs'),
    pool.query("SELECT COUNT(*) FROM parking_zones WHERE is_active = TRUE"),
    pool.query('SELECT COUNT(*) FROM reports'),
    pool.query("SELECT COUNT(*) FROM officers WHERE status = 'aktif'"),
  ]);

  res.json({
    success: true,
    data: {
      totalScan: parseInt(scans.rows[0].count),
      totalLokasiResmi: parseInt(zones.rows[0].count),
      totalLaporan: parseInt(reports.rows[0].count),
      totalPetugasAktif: parseInt(officers.rows[0].count),
    },
  });
}));

export default router;
