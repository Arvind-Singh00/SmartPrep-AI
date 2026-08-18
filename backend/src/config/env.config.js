import dotenv from "dotenv";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Zod schema that validates and coerces every environment variable
 * the application requires. Defaults are provided where sensible;
 * truly required values (DB URI, secrets, API keys) have no default
 * so the app will refuse to start without them.
 */
const optionalNonEmptyString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value.trim() : ""));

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().default(3000),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
    GEMINI_API_KEY: optionalNonEmptyString.default(""),
    GROQ_API_KEY: optionalNonEmptyString.default(""),
    CHROMA_SERVER_URL: z.string().default("http://localhost:8000"),
    MAX_UPLOAD_SIZE_MB: z.coerce.number().default(10),
    CORS_ORIGIN: z
      .string()
      .default("http://localhost:5173,https://smartprep-frontend.onrender.com"),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_MAX_REQS: z.coerce.number().default(100),
  })
  .superRefine((env, ctx) => {
    const hasGroq = Boolean(
      env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 0,
    );
    const hasGemini = Boolean(
      env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0,
    );

    if (!hasGroq && !hasGemini) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GROQ_API_KEY"],
        message:
          "At least one AI provider key is required: either GROQ_API_KEY or GEMINI_API_KEY.",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GEMINI_API_KEY"],
        message:
          "At least one AI provider key is required: either GROQ_API_KEY or GEMINI_API_KEY.",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment variable validation failed:");
  console.error(
    parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n"),
  );
  process.exit(1);
}

const env = parsed.data;

/**
 * Frozen, nested configuration object derived from validated env vars.
 * Import this wherever you need runtime configuration.
 *
 * @type {Readonly<{
 *   env: string,
 *   port: number,
 *   db: { uri: string },
 *   jwt: { secret: string, refreshSecret: string, expiresIn: string, refreshExpiresIn: string },
 *   gemini: { apiKey: string },
 *   chroma: { serverUrl: string },
 *   upload: { maxSizeMb: number },
 *   cors: { origin: string },
 *   rateLimit: { windowMs: number, maxReqs: number }
 * }>}
 */
const config = Object.freeze({
  env: env.NODE_ENV,
  port: env.PORT,
  db: Object.freeze({
    uri: env.MONGODB_URI,
  }),
  jwt: Object.freeze({
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  }),
  gemini: Object.freeze({
    apiKey: env.GEMINI_API_KEY,
  }),
  groq: Object.freeze({
    apiKey: env.GROQ_API_KEY,
  }),
  chroma: Object.freeze({
    serverUrl: env.CHROMA_SERVER_URL,
  }),
  upload: Object.freeze({
    maxSizeMb: env.MAX_UPLOAD_SIZE_MB,
  }),
  cors: Object.freeze({
    origin: env.CORS_ORIGIN,
  }),
  rateLimit: Object.freeze({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxReqs: env.RATE_LIMIT_MAX_REQS,
  }),
});

export default config;
