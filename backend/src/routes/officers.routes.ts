import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorizeAdmin, authorizeSuperadmin } from '../middleware/auth';
import { logAudit } from '../services/audit.service';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/v1/officers — List semua petugas ────────────────────────────────
router.get('/', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { status, zonaId, page = 1, limit = 20, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status) { conditions.push(`o.status = $${idx++}`); params.push(status); }
  if (zonaId) { conditions.push(`o.zona_id = $${idx++}`); params.push(zonaId); }
  if (search) {
    conditions.push(`(o.nama ILIKE $${idx} OR o.nip ILIKE $${idx} OR o.badge_number ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT o.*, u.email, pz.nama AS zona_nama,
            qr.kode AS qr_kode, qr.status AS qr_status
     FROM officers o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN parking_zones pz ON o.zona_id = pz.id
     LEFT JOIN qr_codes qr ON qr.officer_id = o.id AND qr.status = 'aktif'
     ${where}
     ORDER BY o.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, Number(limit), offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM officers o ${where}`,
    params
  );

  res.json({
    success: true,
    data: result.rows,
    total: parseInt(countResult.rows[0].count),
    page: Number(page),
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit)),
  });
}));

// ─── POST /api/v1/officers — Tambah petugas baru ─────────────────────────────
router.post('/', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { nip, nama, nomorHp, zonaId } = req.body;

  if (!nip || !nama) throw createError('NIP dan nama wajib diisi', 400);

  // Cek duplikasi NIP
  const existing = await pool.query('SELECT id FROM officers WHERE nip = $1', [nip]);
  if (existing.rows.length > 0) throw createError(`NIP ${nip} sudah terdaftar`, 409);

  await withTransaction(async (client) => {
    // 1. Buat akun user untuk officer
    const tempEmail = `officer.${nip.toLowerCase()}@lohparkir.id`;
    const tempPassword = `LohParkir@${nip.slice(-4)}`;
    const passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);

    const userResult = await client.query(
      `INSERT INTO users (id, role, nama, email, password_hash, is_active)
       VALUES ($1, 'officer', $2, $3, $4, TRUE) RETURNING id`,
      [uuidv4(), nama, tempEmail, passwordHash]
    );
    const userId = userResult.rows[0].id;

    // 2. Generate badge number
    const year = new Date().getFullYear();
    const seqResult = await client.query(
      `SELECT COUNT(*) AS count FROM officers WHERE badge_number LIKE $1`,
      [`DSH-${year}-%`]
    );
    const seq = parseInt(seqResult.rows[0].count) + 1;
    const badgeNumber = `DSH-${year}-${String(seq).padStart(3, '0')}`;

    // 3. Buat officer record
    const officerResult = await client.query(
      `INSERT INTO officers (user_id, nip, nama, nomor_hp, zona_id, badge_number, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'aktif') RETURNING *`,
      [userId, nip, nama, nomorHp || null, zonaId || null, badgeNumber]
    );

    const officer = officerResult.rows[0];

    await logAudit({
      userId: req.user!.userId,
      aksi: 'CREATE_OFFICER',
      entitas: 'officers',
      entitasId: officer.id,
      dataBaru: { nama, nip, badgeNumber, zonaId },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Petugas ${nama} berhasil didaftarkan`,
      data: {
        ...officer,
        email: tempEmail,
        tempPassword, // Hanya tampilkan sekali untuk diberikan ke petugas
        badgeNumber,
      },
    });
  });
}));

// ─── GET /api/v1/officers/:id — Detail petugas ────────────────────────────────
router.get('/:id', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT o.*, u.email, pz.nama AS zona_nama, pz.tarif_motor, pz.tarif_mobil,
            qr.kode AS qr_kode, qr.status AS qr_status, qr.generated_at AS qr_generated_at
     FROM officers o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN parking_zones pz ON o.zona_id = pz.id
     LEFT JOIN qr_codes qr ON qr.officer_id = o.id AND qr.status = 'aktif'
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) throw createError('Petugas tidak ditemukan', 404);
  res.json({ success: true, data: result.rows[0] });
}));

// ─── PUT /api/v1/officers/:id — Update petugas ────────────────────────────────
router.put('/:id', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { nama, nomorHp, zonaId, status } = req.body;

  const current = await pool.query('SELECT * FROM officers WHERE id = $1', [req.params.id]);
  if (!current.rows[0]) throw createError('Petugas tidak ditemukan', 404);

  const officer = current.rows[0];
  const updated = await pool.query(
    `UPDATE officers SET
       nama = COALESCE($1, nama),
       nomor_hp = COALESCE($2, nomor_hp),
       zona_id = COALESCE($3, zona_id),
       status = COALESCE($4, status),
       updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [nama || null, nomorHp || null, zonaId || null, status || null, req.params.id]
  );

  await logAudit({
    userId: req.user!.userId,
    aksi: 'UPDATE_OFFICER',
    entitas: 'officers',
    entitasId: req.params.id,
    dataLama: { nama: officer.nama, status: officer.status, zonaId: officer.zona_id },
    dataBaru: { nama, status, zonaId },
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Data petugas berhasil diperbarui', data: updated.rows[0] });
}));

// ─── PATCH /api/v1/officers/:id/toggle — Aktifkan/nonaktifkan ────────────────
router.patch('/:id/toggle', authenticate, authorizeAdmin, asyncHandler(async (req: Request, res: Response) => {
  const officer = await pool.query('SELECT * FROM officers WHERE id = $1', [req.params.id]);
  if (!officer.rows[0]) throw createError('Petugas tidak ditemukan', 404);

  const newStatus = officer.rows[0].status === 'aktif' ? 'nonaktif' : 'aktif';
  await pool.query('UPDATE officers SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, req.params.id]);

  // Jika dinonaktifkan, cabut QR aktif
  if (newStatus === 'nonaktif') {
    await pool.query(
      `UPDATE qr_codes SET status = 'revoked', revoked_at = NOW() WHERE officer_id = $1 AND status = 'aktif'`,
      [req.params.id]
    );
  }

  await logAudit({
    userId: req.user!.userId,
    aksi: 'UPDATE_OFFICER',
    entitas: 'officers',
    entitasId: req.params.id,
    dataLama: { status: officer.rows[0].status },
    dataBaru: { status: newStatus },
  });

  res.json({
    success: true,
    message: `Petugas berhasil ${newStatus === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}`,
    data: { status: newStatus },
  });
}));

export default router;
