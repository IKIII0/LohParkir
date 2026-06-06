import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimiter';
import {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth';
import { logAudit } from '../services/audit.service';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

const router = Router();

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
router.post('/login', authLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('Email dan password wajib diisi', 400);
  }

  const result = await pool.query(
    'SELECT id, role, nama, email, password_hash, is_active FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  const user = result.rows[0];
  if (!user || !user.password_hash) {
    throw createError('Email atau password salah', 401);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw createError('Email atau password salah', 401);
  }

  if (!user.is_active) {
    throw createError('Akun Anda telah dinonaktifkan. Hubungi administrator.', 403);
  }

  // Hanya admin & superadmin yang bisa login via dashboard
  if (!['admin', 'superadmin', 'officer'].includes(user.role)) {
    throw createError('Akun ini tidak memiliki akses ke dashboard', 403);
  }

  const payload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Update last_login
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  // Resolve officerId if role is officer
  let officerId = null;
  if (user.role === 'officer') {
    const offRes = await pool.query('SELECT id FROM officers WHERE user_id = $1', [user.id]);
    if (offRes.rows[0]) {
      officerId = offRes.rows[0].id;
    }
  }

  // Audit log
  await logAudit({
    userId: user.id,
    aksi: 'LOGIN',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({
    success: true,
    message: `Selamat datang, ${user.nama}!`,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        officerId,
      },
    },
  });
}));

// ─── POST /api/v1/auth/register ────────────────────────────────────────────────
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { nama, email, password, role, nip, nomorHp } = req.body;

  if (!nama || !email || !password || !role) {
    throw createError('Formulir pendaftaran tidak lengkap', 400);
  }

  if (!['public', 'officer'].includes(role)) {
    throw createError('Role tidak valid', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Cek email duplikat
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existingUser.rows.length > 0) {
    throw createError('Email sudah terdaftar', 409);
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const userId = uuidv4();

  let registeredData = null;

  if (role === 'officer') {
    if (!nip) {
      throw createError('NIP wajib diisi untuk pendaftaran Petugas', 400);
    }
    // Cek duplikasi NIP
    const existingOfficer = await pool.query('SELECT id FROM officers WHERE nip = $1', [nip]);
    if (existingOfficer.rows.length > 0) {
      throw createError(`NIP ${nip} sudah terdaftar`, 409);
    }

    registeredData = await withTransaction(async (client) => {
      // 1. Buat akun user
      await client.query(
        `INSERT INTO users (id, role, nama, email, password_hash, is_active)
         VALUES ($1, 'officer', $2, $3, $4, TRUE)`,
        [userId, nama, normalizedEmail, passwordHash]
      );

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
        `INSERT INTO officers (user_id, nip, nama, nomor_hp, badge_number, status)
         VALUES ($1, $2, $3, $4, $5, 'aktif') RETURNING *`,
        [userId, nip, nama, nomorHp || null, badgeNumber]
      );

      return {
        userId,
        officerId: officerResult.rows[0].id,
        badgeNumber,
        role: 'officer',
      };
    });
  } else {
    // Role public
    await pool.query(
      `INSERT INTO users (id, role, nama, email, password_hash, is_active)
       VALUES ($1, 'public', $2, $3, $4, TRUE)`,
      [userId, nama, normalizedEmail, passwordHash]
    );
    registeredData = {
      userId,
      role: 'public',
    };
  }

  // Audit log
  await logAudit({
    userId,
    aksi: 'REGISTER',
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Pendaftaran berhasil. Silakan login untuk melanjutkan.',
    data: registeredData,
  });
}));

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw createError('Refresh token diperlukan', 400);

  try {
    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    });
    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch {
    throw createError('Refresh token tidak valid atau sudah kadaluarsa', 401);
  }
}));

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await logAudit({
    userId: req.user!.userId,
    aksi: 'LOGOUT',
    ipAddress: req.ip,
  });
  // Pada produksi: tambahkan token ke blacklist (Redis)
  res.json({ success: true, message: 'Berhasil logout' });
}));

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, nama, email, role, is_active, last_login_at, created_at FROM users WHERE id = $1',
    [req.user!.userId]
  );
  if (!result.rows[0]) throw createError('User tidak ditemukan', 404);
  const user = result.rows[0];

  // Resolve officerId if role is officer
  let officerId = null;
  if (user.role === 'officer') {
    const offRes = await pool.query('SELECT id FROM officers WHERE user_id = $1', [user.id]);
    if (offRes.rows[0]) {
      officerId = offRes.rows[0].id;
    }
  }

  res.json({
    success: true,
    data: {
      ...user,
      officerId,
    },
  });
}));

// ─── PUT /api/v1/auth/fcm-token ───────────────────────────────────────────────
router.put('/fcm-token', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { fcmToken } = req.body;
  if (!fcmToken) throw createError('FCM token diperlukan', 400);
  await pool.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [fcmToken, req.user!.userId]);
  res.json({ success: true, message: 'FCM token berhasil diperbarui' });
}));

export default router;
