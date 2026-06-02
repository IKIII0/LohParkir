import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

// ─── GET /api/v1/notifications — List notifikasi user ────────────────────────
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE target_user_id = $1 OR target_user_id IS NULL
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user!.userId, Number(limit), offset]
  );

  const unreadCount = await pool.query(
    `SELECT COUNT(*) FROM notifications
     WHERE (target_user_id = $1 OR target_user_id IS NULL) AND is_read = FALSE`,
    [req.user!.userId]
  );

  res.json({
    success: true,
    data: result.rows,
    unreadCount: parseInt(unreadCount.rows[0].count),
  });
}));

// ─── PATCH /api/v1/notifications/:id/read — Tandai terbaca ───────────────────
router.patch('/:id/read', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
  res.json({ success: true, message: 'Notifikasi ditandai sebagai terbaca' });
}));

// ─── PATCH /api/v1/notifications/read-all — Tandai semua terbaca ──────────────
router.patch('/read-all', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE target_user_id = $1 AND is_read = FALSE',
    [req.user!.userId]
  );
  res.json({ success: true, message: 'Semua notifikasi ditandai sebagai terbaca' });
}));

export default router;
