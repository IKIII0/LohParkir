import { pool } from '../config/database';
import { env } from '../config/env';

interface SendNotificationOptions {
  targetUserId?: string;       // null = broadcast ke semua admin
  judul: string;
  pesan: string;
  tipe: 'laporan_status' | 'laporan_baru' | 'emergency' | 'system';
  priority?: 'normal' | 'high';
  dataPayload?: object;
}

/**
 * Kirim push notification via FCM
 * (Mock untuk development jika Firebase tidak dikonfigurasi)
 */
async function sendFCMNotification(
  fcmToken: string,
  judul: string,
  pesan: string,
  priority: 'normal' | 'high',
  dataPayload?: object
): Promise<void> {
  if (!env.FIREBASE_PROJECT_ID) {
    // Mock mode — hanya log
    console.log(`[FCM MOCK] Push to token: ${fcmToken.substring(0, 20)}...`);
    console.log(`  Title: ${judul}`);
    console.log(`  Body: ${pesan}`);
    console.log(`  Priority: ${priority}`);
    return;
  }

  // TODO: Integrasi Firebase Admin SDK
  // const message = {
  //   token: fcmToken,
  //   notification: { title: judul, body: pesan },
  //   android: { priority: priority === 'high' ? 'high' : 'normal' },
  //   data: dataPayload ? Object.fromEntries(Object.entries(dataPayload).map(([k,v]) => [k, String(v)])) : {},
  // };
  // await firebaseAdmin.messaging().send(message);
}

/**
 * Kirim notifikasi dan simpan ke database
 */
export async function sendNotification(opts: SendNotificationOptions): Promise<void> {
  // Simpan ke database
  await pool.query(
    `INSERT INTO notifications (target_user_id, judul, pesan, tipe, priority, data_payload)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      opts.targetUserId || null,
      opts.judul,
      opts.pesan,
      opts.tipe,
      opts.priority || 'normal',
      opts.dataPayload ? JSON.stringify(opts.dataPayload) : null,
    ]
  );

  // Kirim FCM ke target user atau semua admin
  try {
    if (opts.targetUserId) {
      const userResult = await pool.query(
        'SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL',
        [opts.targetUserId]
      );
      if (userResult.rows[0]?.fcm_token) {
        await sendFCMNotification(
          userResult.rows[0].fcm_token,
          opts.judul,
          opts.pesan,
          opts.priority || 'normal',
          opts.dataPayload
        );
      }
    } else {
      // Broadcast ke semua admin
      const admins = await pool.query(
        "SELECT fcm_token FROM users WHERE role IN ('admin','superadmin') AND fcm_token IS NOT NULL AND is_active = TRUE"
      );
      await Promise.allSettled(
        admins.rows.map((u: { fcm_token: string }) =>
          sendFCMNotification(u.fcm_token, opts.judul, opts.pesan, opts.priority || 'normal', opts.dataPayload)
        )
      );
    }
  } catch (err) {
    console.error('[NOTIFICATION] FCM send failed:', err);
  }
}

/**
 * Emergency Alert — Tombol Panik Petugas
 */
export async function sendEmergencyAlert(officerData: {
  officerId: string;
  namaOfficer: string;
  badgeNumber: string;
  gpsLat: number;
  gpsLng: number;
}): Promise<void> {
  await sendNotification({
    judul: '🚨 DARURAT — Petugas Membutuhkan Bantuan',
    pesan: `Petugas ${officerData.namaOfficer} (${officerData.badgeNumber}) menekan tombol darurat!`,
    tipe: 'emergency',
    priority: 'high',
    dataPayload: officerData,
  });
}
