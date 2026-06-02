import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { createTransaction, confirmPayment } from "../services/payment.service";
import { generateIdempotencyKey } from "../services/qr.service";
import { wsBroadcast } from "../config/websocket";

const router = Router();

// ─── POST /api/v1/transactions — Buat transaksi baru ─────────────────────────
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { officerId, zonaId, nominal, metode, idempotencyKey } = req.body;

    if (!officerId || !nominal || !metode) {
      throw createError("officerId, nominal, dan metode wajib diisi", 400);
    }
    if (!["qris", "tunai"].includes(metode)) {
      throw createError('Metode harus "qris" atau "tunai"', 400);
    }
    if (isNaN(parseFloat(nominal)) || parseFloat(nominal) <= 0) {
      throw createError("Nominal tidak valid", 400);
    }

    const userId = (req as any).user?.userId || null;

    const result = await createTransaction({
      officerId,
      zonaId,
      nominal: parseFloat(nominal),
      metode,
      userId,
      idempotencyKey: idempotencyKey || generateIdempotencyKey(),
    });

    wsBroadcast("NEW_TRANSACTION", {
      transactionId: result.transactionId,
      nominal: parseFloat(nominal),
      metode,
      status: result.status,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  }),
);

// ─── POST /api/v1/transactions/webhook — Konfirmasi dari payment gateway ──────
router.post(
  "/webhook",
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Validasi signature dari payment gateway
    const { transactionId, qrisRef, status } = req.body;

    if (!transactionId || !qrisRef) {
      throw createError("transactionId dan qrisRef diperlukan", 400);
    }

    if (status === "settlement" || status === "capture") {
      await confirmPayment(transactionId, qrisRef);
      wsBroadcast("NEW_TRANSACTION", {
        transactionId,
        status: "berhasil",
        qrisRef,
      });
    }

    // Respond 200 ke payment gateway
    res.json({ success: true });
  }),
);

// ─── GET /api/v1/transactions — List transaksi (admin) ───────────────────────
router.get(
  "/",
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      metode,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (metode) {
      conditions.push(`t.metode = $${idx++}`);
      params.push(metode);
    }
    if (status) {
      conditions.push(`t.status = $${idx++}`);
      params.push(status);
    }
    if (startDate) {
      conditions.push(`t.created_at >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`t.created_at <= $${idx++}`);
      params.push(endDate + "T23:59:59Z");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT t.*, o.nama AS officer_nama, o.badge_number, pz.nama AS zona_nama
     FROM transactions t
     LEFT JOIN officers o ON t.officer_id = o.id
     LEFT JOIN parking_zones pz ON t.zona_id = pz.id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
      [...params, Number(limit), offset],
    );

    const countResult = await pool.query(
      `SELECT COUNT(*), COALESCE(SUM(CASE WHEN t.status = 'berhasil' THEN nominal ELSE 0 END), 0) AS total_nominal FROM transactions t ${where}`,
      params,
    );

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      totalNominal: parseFloat(countResult.rows[0].total_nominal || "0"),
      page: Number(page),
      totalPages: Math.ceil(
        parseInt(countResult.rows[0].count) / Number(limit),
      ),
    });
  }),
);

// ─── GET /api/v1/transactions/my — Riwayat transaksi user ────────────────────
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await pool.query(
      `SELECT t.id, t.metode, t.nominal, t.status, t.created_at,
            o.nama AS officer_nama, o.badge_number, pz.nama AS zona_nama
     FROM transactions t
     LEFT JOIN officers o ON t.officer_id = o.id
     LEFT JOIN parking_zones pz ON t.zona_id = pz.id
     WHERE t.user_id = $1
     ORDER BY t.created_at DESC
     LIMIT $2 OFFSET $3`,
      [req.user!.userId, Number(limit), offset],
    );

    res.json({ success: true, data: result.rows });
  }),
);

export default router;
