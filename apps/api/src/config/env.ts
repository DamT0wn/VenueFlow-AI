import { z } from 'zod';

// ──────────────────────────────────────────────────────────────────────────────
// Environment Schema
// All environment variables are validated at startup.
// The app crashes immediately with a descriptive error if any required
// variable is missing or malformed.
// ──────────────────────────────────────────────────────────────────────────────

const EnvSchema = z.object({
  // Server
  /** Express port — defaults to 3001 */
  PORT: z.coerce.number().int().positive().default(3001),
  /** Execution environment */
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Redis
  /** Redis connection URL — provided by Docker Compose or GCP Secret Manager */
  REDIS_URL: z.string().url().describe('Redis connection URL'),

  // Firebase
  /**
   * Firebase project ID.
   * In emulator mode this is set to "demo-venueflow".
   */
  FIREBASE_PROJECT_ID: z.string().min(1).describe('Firebase project ID'),
  /**
   * JSON-encoded Firebase Admin service account.
   * In emulator mode, any non-empty string is accepted.
   */
  FIREBASE_SERVICE_ACCOUNT_JSON: z
    .string()
    .optional()
    .describe('JSON-encoded Firebase Admin service account'),

  // Firebase Emulator overrides (set by Docker Compose in dev)
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  PUBSUB_EMULATOR_HOST: z.string().optional(),

  // Google Cloud Pub/Sub
  /** GCP project ID for Pub/Sub */
  PUBSUB_PROJECT_ID: z.string().default('demo-venueflow'),
  /** Pub/Sub topic name for venue alerts */
  PUBSUB_TOPIC: z.string().default('venue-alerts-development'),

  // CORS
  /**
   * Comma-separated list of allowed CORS origins.
   * @example "https://venueflow.app,https://admin.venueflow.app"
   */
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) => v.split(',').map((o) => o.trim())),

  // Rate limiting
  /** Sliding window duration in milliseconds */
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  /** Max requests per window per IP on public routes */
  RATE_LIMIT_PUBLIC_MAX: z.coerce.number().int().positive().default(100),
  /** Max requests per window per user on write routes */
  RATE_LIMIT_WRITE_MAX: z.coerce.number().int().positive().default(20),

  // Logging
  /** Minimum log level */
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Validated, typed environment configuration.
 * Access all env vars through this object — never read process.env directly.
 *
 * @throws {ZodError} If any required environment variable is missing or invalid.
 */
function parseEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    // Intentionally crash fast with a clear message
    console.error(
      `\n❌  VenueFlow API failed to start — missing or invalid environment variables:\n${formatted}\n` +
        `\n  Copy .env.example to .env.local and fill in the required values.\n`,
    );
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
