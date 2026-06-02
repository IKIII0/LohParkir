import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorizeAdmin, authorizeSuperadmin } from '../middleware/auth';
import { getAuditTrail, logAudit } from '../services/audit.service';
import { sendEmergencyAlert } from '../services/notification.service';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/v1/admin/audit — Audit trail (superadmin) ──────────────────────
router.get('/audit', authenticate, authorizeSuperadmin, asyncHandler(async (req: Request, res: Response) => {
  const { userId, aksi, entitas, startDate, endDate, page, limit } = req.query;
  const result = await getAuditTrail({
    userId: userId as string,
    aksi: aksi as string,
    entitas: entitas as string,
    startDate: startDate as string,
    endDate: endDate as string,
    page: Number(page) || 1,
    limit: Number(limit) || 50,
  });
  res.json({ success: true, ...result });
}));

// ─── GET /api/v1/admin/users — List semua user (superadmin) ──────────────────
router.get('/users', authenticate, authorizeSuperadmin, asyncHandler(async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, role, nama, email, is_active, last_login_at, created_at
     FROM users ORDER BY created_at DESC`
  );
  res.json({ success: true, data: result.rows });
}));

// ─── PATCH /api/v1/admin/users/:id/role — Update role user (superadmin) ──────
router.patch('/users/:id/role', authenticate, authorizeSuperadmin, asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  const validRoles = ['public', 'officer', 'admin', 'superadmin'];
  if (!role || !validRoles.includes(role)) {
    throw createError(`Role tidak valid. Pilih: ${validRoles.join(', ')}`, 400);
  }

  const current = await pool.query('SELECT id, role, nama FROM users WHERE id = $1', [req.params.id]);
  if (!current.rows[0]) throw createError('User tidak ditemukan', 404);

  // Lindungi: superadmin tidak bisa menurunkan role superadmin terakhir
  if (current.rows[0].role === 'superadmin' && role !== 'superadmin') {
    const superadminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'superadmin' AND is_active = TRUE");
    if (parseInt(superadminCount.rows[0].count) <= 1) {
      throw createError('Tidak dapat mengubah role superadmin terakhir yang aktif', 400);
    }
  }

  await pool.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, req.params.id]);

  await logAudit({
    userId: req.user!.userId,
    aksi: 'UPDATE_USER_ROLE',
    entitas: 'users',
    entitasId: req.params.id,
    dataLama: { role: current.rows[0].role },
    dataBaru: { role },
    ipAddress: req.ip,
  });

  res.json({ success: true, message: `Role user ${current.rows[0].nama} berhasil diubah ke ${role}` });
}));

// ─── PATCH /api/v1/admin/users/:id/toggle — Aktifkan/nonaktifkan user ─────────
router.patch('/users/:id/toggle', authenticate, authorizeSuperadmin, asyncHandler(async (req: Request, res: Response) => {
  const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!user.rows[0]) throw createError('User tidak ditemukan', 404);

  const newStatus = !user.rows[0].is_active;
  await pool.query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [newStatus, req.params.id]);

  await logAudit({
    userId: req.user!.userId,
    aksi: 'DEACTIVATE_USER',
    entitas: 'users',
    entitasId: req.params.id,
    dataLama: { is_active: user.rows[0].is_active },
    dataBaru: { is_active: newStatus },
  });

  res.json({
    success: true,
    message: `User berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
    data: { isActive: newStatus },
  });
}));

// ─── POST /api/v1/admin/users — Tambah admin baru (superadmin) ───────────────
router.post('/users', authenticate, authorizeSuperadmin, asyncHandler(async (req: Request, res: Response) => {
  const { nama, email, role, password } = req.body;
  if (!nama || !email || !role || !password) {
    throw createError('nama, email, role, dan password wajib diisi', 400);
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) throw createError('Email sudah terdaftar', 409);

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (id, role, nama, email, password_hash, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id, nama, email, role, created_at`,
    [uuidv4(), role, nama, email.toLowerCase(), passwordHash]
  );

  await logAudit({
    userId: req.user!.userId,
    aksi: 'CREATE_OFFICER',
    entitas: 'users',
    entitasId: result.rows[0].id,
    dataBaru: { nama, email, role },
  });

  res.status(201).json({ success: true, message: 'Akun berhasil dibuat', data: result.rows[0] });
}));

// ─── POST /api/v1/admin/emergency — Tombol panik petugas ─────────────────────
router.post('/emergency', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'officer') throw createError('Hanya petugas yang dapat menggunakan tombol darurat', 403);

  const { gpsLat, gpsLng } = req.body;
  if (!gpsLat || !gpsLng) throw createError('Lokasi GPS diperlukan untuk emergency alert', 400);

  // Ambil data officer
  const officerResult = await pool.query(
    'SELECT o.id, o.nama, o.badge_number FROM officers o WHERE o.user_id = $1',
    [req.user!.userId]
  );
  if (!officerResult.rows[0]) throw createError('Data petugas tidak ditemukan', 404);

  const officer = officerResult.rows[0];
  await sendEmergencyAlert({
    officerId: officer.id,
    namaOfficer: officer.nama,
    badgeNumber: officer.badge_number,
    gpsLat: parseFloat(gpsLat),
    gpsLng: parseFloat(gpsLng),
  });

  res.json({
    success: true,
    message: 'Alert darurat telah dikirim ke seluruh Admin Dishub. Bantuan sedang dalam perjalanan.',
  });
}));

export default router;
