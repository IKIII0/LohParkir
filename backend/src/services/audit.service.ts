import { pool } from '../config/database';

export type AuditAction =
  | 'LOGIN' | 'LOGOUT'
  | 'CREATE_OFFICER' | 'UPDATE_OFFICER' | 'DELETE_OFFICER'
  | 'GENERATE_QR' | 'REVOKE_QR'
  | 'UPDATE_REPORT_STATUS'
  | 'CREATE_ZONE' | 'UPDATE_ZONE' | 'DELETE_ZONE'
  | 'UPDATE_USER_ROLE' | 'DEACTIVATE_USER'
  | 'UPDATE_TARIF'
  | 'VIEW_ENCRYPTED_DATA'
  | 'EXPORT_REPORT';

interface AuditEntry {
  userId: string;
  aksi: AuditAction | string;
  entitas?: string;
  entitasId?: string;
  dataLama?: object;
  dataBaru?: object;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Catat aksi ke audit trail
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_trail (user_id, aksi, entitas, entitas_id, data_lama, data_baru, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.userId,
        entry.aksi,
        entry.entitas || null,
        entry.entitasId || null,
        entry.dataLama ? JSON.stringify(entry.dataLama) : null,
        entry.dataBaru ? JSON.stringify(entry.dataBaru) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
      ]
    );
  } catch (err) {
    // Audit trail gagal tidak boleh crash aplikasi utama
    console.error('[AUDIT] Failed to log audit entry:', err);
  }
}

/**
 * Ambil audit trail dengan filter
 */
export async function getAuditTrail(filters: {
  userId?: string;
  aksi?: string;
  entitas?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.userId) {
    conditions.push(`at.user_id = $${paramIdx++}`);
    params.push(filters.userId);
  }
  if (filters.aksi) {
    conditions.push(`at.aksi ILIKE $${paramIdx++}`);
    params.push(`%${filters.aksi}%`);
  }
  if (filters.entitas) {
    conditions.push(`at.entitas = $${paramIdx++}`);
    params.push(filters.entitas);
  }
  if (filters.startDate) {
    conditions.push(`at.timestamp >= $${paramIdx++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`at.timestamp <= $${paramIdx++}`);
    params.push(filters.endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT at.*, u.nama AS user_nama, u.email AS user_email
    FROM audit_trail at
    LEFT JOIN users u ON at.user_id = u.id
    ${where}
    ORDER BY at.timestamp DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx}
  `;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM audit_trail at ${where}`,
    params.slice(0, -2)
  );

  return {
    data: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
  };
}
