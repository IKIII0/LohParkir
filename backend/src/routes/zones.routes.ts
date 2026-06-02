import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorizeAdmin, authorizeSuperadmin } from '../middleware/auth';
import { logAudit } from '../services/audit.service';

const router = Router();

// ─── GET /api/v1/zones — List zona parkir ────────────────────────────────────
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT z.*, COUNT(o.id) AS jumlah_petugas
     FROM parking_zones z
     LEFT JOIN officers o ON o.zona_id = z.id AND o.status = 'aktif'
     GROUP BY z.id
     ORDER BY z.nama`
  );
  res.json({ success: true, data: result.rows });
}));

// ─── POST /api/v1/zones — Tambah zona (admin) ────────────────────────────────
router.post('/', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { nama, alamat, lat, lng, tarifMotor, tarifMobil, kota } = req.body;
  if (!nama || !lat || !lng) throw createError('nama, lat, lng wajib diisi', 400);

  const result = await pool.query(
    `INSERT INTO parking_zones (nama, alamat, koordinat, kota, tarif_motor, tarif_mobil)
     VALUES ($1, $2, POINT($3,$4), $5, $6, $7) RETURNING *`,
    [nama, alamat || null, parseFloat(lat), parseFloat(lng), kota || 'Medan', tarifMotor || 2000, tarifMobil || 5000]
  );

  await logAudit({
    userId: req.user!.userId,
    aksi: 'CREATE_ZONE',
    entitas: 'parking_zones',
    entitasId: result.rows[0].id,
    dataBaru: { nama, lat, lng },
  });

  res.status(201).json({ success: true, message: 'Zona parkir berhasil ditambahkan', data: result.rows[0] });
}));

// ─── PUT /api/v1/zones/:id — Update zona (admin) ─────────────────────────────
router.put('/:id', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { nama, alamat, lat, lng, tarifMotor, tarifMobil, isActive } = req.body;

  const current = await pool.query('SELECT * FROM parking_zones WHERE id = $1', [req.params.id]);
  if (!current.rows[0]) throw createError('Zona tidak ditemukan', 404);

  const result = await pool.query(
    `UPDATE parking_zones SET
       nama = COALESCE($1, nama),
       alamat = COALESCE($2, alamat),
       koordinat = COALESCE(POINT($3,$4), koordinat),
       tarif_motor = COALESCE($5, tarif_motor),
       tarif_mobil = COALESCE($6, tarif_mobil),
       is_active = COALESCE($7, is_active),
       updated_at = NOW()
     WHERE id = $8 RETURNING *`,
    [nama || null, alamat || null, lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null,
     tarifMotor || null, tarifMobil || null, isActive ?? null, req.params.id]
  );

  await logAudit({
    userId: req.user!.userId,
    aksi: 'UPDATE_ZONE',
    entitas: 'parking_zones',
    entitasId: req.params.id,
    dataLama: current.rows[0],
    dataBaru: req.body,
  });

  res.json({ success: true, data: result.rows[0] });
}));

export default router;
