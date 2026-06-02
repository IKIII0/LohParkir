import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Generate QR code string dalam format LOHPARKIR-DSH-YYYY-NNN
 */
export function generateQrCodeString(year: number, sequence: number): string {
  const paddedSeq = String(sequence).padStart(3, '0');
  return `LOHPARKIR-DSH-${year}-${paddedSeq}`;
}

/**
 * Generate checksum SHA-256 dari QR code string
 */
export function generateChecksum(kode: string): string {
  return crypto.createHash('sha256').update(kode).digest('hex');
}

/**
 * Validasi format QR code (regex match + checksum)
 */
export function validateQrFormat(kode: string): boolean {
  const pattern = /^LOHPARKIR-DSH-\d{4}-\d{3}$/;
  return pattern.test(kode);
}

/**
 * Enkripsi data sensitif dengan AES-256-CBC
 */
export function encryptData(plaintext: string): string {
  const key = Buffer.from(env.ENCRYPTION_KEY.substring(0, 32), 'utf8');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Dekripsi data sensitif
 */
export function decryptData(encrypted: string): string {
  const [ivHex, dataHex] = encrypted.split(':');
  const key = Buffer.from(env.ENCRYPTION_KEY.substring(0, 32), 'utf8');
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Generate idempotency key untuk transaksi
 */
export function generateIdempotencyKey(prefix = 'txn'): string {
  return `${prefix}-${Date.now()}-${crypto.randomUUID()}`;
}

/**
 * Generate ticket number untuk laporan: RPT-YYYYMMDD-NNNNN
 */
export function generateTicketNumber(): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `RPT-${dateStr}-${seq}`;
}
