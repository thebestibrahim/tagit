const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TAGIT_HMAC_SECRET",
  "RESEND_API_KEY",
] as const;

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}\n` +
    "Check your .env.local file or Vercel environment settings."
  );
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  hmacSecret: process.env.TAGIT_HMAC_SECRET!,
  resendApiKey: process.env.RESEND_API_KEY!,
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "info@tagitlux.com",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  groqApiKey: process.env.GROQ_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
} as const;
