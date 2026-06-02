import { pool } from '../config/database';
import { env } from '../config/env';
import { generateIdempotencyKey } from './qr.service';

export interface PaymentRequest {
  officerId: string;
  zonaId?: string;
  nominal: number;
  metode: 'qris' | 'tunai';
  userId?: string;
  idempotencyKey?: string;
}

export interface PaymentResult {
  transactionId: string;
  status: 'pending' | 'berhasil' | 'gagal';
  paymentUrl?: string;
  qrisRef?: string;
  message: string;
}

/**
 * Mock QRIS Payment — untuk development.
 * Pada production, ganti dengan integrasi payment gateway nyata (Midtrans, Xendit, dll.)
 */
async function mockQrisPayment(nominal: number, idempotencyKey: string): Promise<{
  status: 'pending';
  paymentUrl: string;
  qrisRef: string;
}> {
  // Simulate payment URL generation
  const qrisRef = `QRIS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const paymentUrl = `https://mock-payment.lohparkir.id/pay?ref=${qrisRef}&amount=${nominal}`;
  return { status: 'pending', paymentUrl, qrisRef };
}

/**
 * Buat transaksi baru — dengan idempotency check
 */
export async function createTransaction(req: PaymentRequest): Promise<PaymentResult> {
  const idemKey = req.idempotencyKey || generateIdempotencyKey('txn');

  // Cek idempotency: apakah transaksi dengan key ini sudah ada?
  const existing = await pool.query(
    'SELECT id, status, payment_url, qris_ref FROM transactions WHERE idempotency_key = $1',
    [idemKey]
  );
  if (existing.rows.length > 0) {
    const tx = existing.rows[0];
    return {
      transactionId: tx.id,
      status: tx.status,
      paymentUrl: tx.payment_url,
      qrisRef: tx.qris_ref,
      message: 'Transaksi sudah ada (idempotent)',
    };
  }

  let paymentUrl: string | undefined;
  let qrisRef: string | undefined;
  let status: 'pending' | 'berhasil' = req.metode === 'tunai' ? 'berhasil' : 'pending';

  if (req.metode === 'qris') {
    if (env.PAYMENT_MODE === 'mock') {
      const mockResult = await mockQrisPayment(req.nominal, idemKey);
      paymentUrl = mockResult.paymentUrl;
      qrisRef = mockResult.qrisRef;
      status = mockResult.status;
    }
    // TODO: live payment gateway integration
  }

  const result = await pool.query(
    `INSERT INTO transactions (user_id, officer_id, zona_id, metode, nominal, status, idempotency_key, payment_url, qris_ref)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [req.userId || null, req.officerId, req.zonaId || null, req.metode, req.nominal, status, idemKey, paymentUrl || null, qrisRef || null]
  );

  return {
    transactionId: result.rows[0].id,
    status,
    paymentUrl,
    qrisRef,
    message: req.metode === 'tunai' ? 'Pembayaran tunai berhasil dicatat' : 'QRIS berhasil dibuat. Scan kode untuk membayar.',
  };
}

/**
 * Konfirmasi pembayaran via webhook dari payment gateway
 */
export async function confirmPayment(transactionId: string, qrisRef: string): Promise<void> {
  await pool.query(
    `UPDATE transactions SET status = 'berhasil', qris_ref = $1, updated_at = NOW()
     WHERE id = $2 AND status = 'pending'`,
    [qrisRef, transactionId]
  );
}

/**
 * Refund otomatis jika pembayaran gagal
 */
export async function processRefund(transactionId: string): Promise<void> {
  await pool.query(
    `UPDATE transactions SET status = 'refunded', refund_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'gagal'`,
    [transactionId]
  );
  // TODO: trigger refund ke payment gateway
}
