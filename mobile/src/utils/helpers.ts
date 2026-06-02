/**
 * Helper utilities for the mobile app
 */

/**
 * Format nominal rupiah
 */
export function formatRupiah(nominal: number): string {
  return `Rp ${nominal.toLocaleString('id-ID')}`;
}

/**
 * Format tanggal Indonesia
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format tanggal & waktu Indonesia
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${formatDate(dateStr)}, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

/**
 * Generate idempotency key untuk transaksi
 */
export function generateIdempotencyKey(prefix = 'txn'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Truncate string
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
