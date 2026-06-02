import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  PORT:                   z.coerce.number().default(3001),
  APP_NAME:               z.string().default('LohParkir API'),
  APP_VERSION:            z.string().default('1.0.0'),

  // Database
  DB_HOST:                z.string().default('localhost'),
  DB_PORT:                z.coerce.number().default(5432),
  DB_NAME:                z.string().default('lohparkir'),
  DB_USER:                z.string().default('postgres'),
  DB_PASSWORD:            z.string(),
  DB_POOL_MIN:            z.coerce.number().default(2),
  DB_POOL_MAX:            z.coerce.number().default(10),

  // JWT
  JWT_SECRET:             z.string().min(32),
  JWT_REFRESH_SECRET:     z.string().min(32),
  JWT_EXPIRY:             z.string().default('15m'),
  JWT_REFRESH_EXPIRY:     z.string().default('7d'),

  // Firebase
  FIREBASE_PROJECT_ID:   z.string().optional(),
  FIREBASE_PRIVATE_KEY:  z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),

  // Payment
  PAYMENT_MODE:           z.enum(['mock', 'live']).default('mock'),
  PAYMENT_GATEWAY_URL:    z.string().optional(),
  PAYMENT_GATEWAY_KEY:    z.string().optional(),
  PAYMENT_MERCHANT_ID:    z.string().optional(),

  // File
  UPLOAD_DIR:             z.string().default('./uploads'),
  MAX_FILE_SIZE_MB:       z.coerce.number().default(10),

  // Security
  ENCRYPTION_KEY:         z.string().min(32),
  BCRYPT_ROUNDS:          z.coerce.number().default(12),
  RATE_LIMIT_WINDOW_MS:   z.coerce.number().default(60000),
  RATE_LIMIT_MAX:         z.coerce.number().default(100),

  // CORS
  ALLOWED_ORIGINS:        z.string().default('http://localhost:3000'),
});

function loadEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      err.errors.forEach((e) => console.error(`  - ${e.path.join('.')}: ${e.message}`));
    }
    process.exit(1);
  }
}

export const env = loadEnv();
export type Env = typeof env;
