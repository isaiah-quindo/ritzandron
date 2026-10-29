import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const env = process.env

const paymentProviders = env.SQUARE_ACCESS_TOKEN
  ? [
      {
        resolve: "./src/modules/square-payment",
        id: "square",
        options: {
          accessToken: env.SQUARE_ACCESS_TOKEN,
          locationId: env.SQUARE_LOCATION_ID,
          environment: env.SQUARE_ENVIRONMENT ?? "sandbox",
          capture: env.SQUARE_AUTO_CAPTURE !== "false",
          webhookSignatureKey: env.SQUARE_WEBHOOK_SIGNATURE_KEY,
          webhookUrl: env.MEDUSA_BACKEND_URL
            ? `${env.MEDUSA_BACKEND_URL}/hooks/payment/square_square`
            : undefined,
        },
      },
    ]
  : []

// Mailtrap (local dev test inbox) takes priority over Resend, but never in
// production, so customer email can't end up in a test inbox. With neither,
// emails are logged to the console by the local provider.
const isProduction = env.NODE_ENV === "production"
const mailtrap =
  !isProduction && env.MAILTRAP_API_TOKEN && env.MAILTRAP_INBOX_ID
    ? { api_token: env.MAILTRAP_API_TOKEN, inbox_id: env.MAILTRAP_INBOX_ID }
    : undefined

// Settings that silently degrade in production instead of failing outright.
if (isProduction) {
  const problems = [
    !env.RESEND_API_KEY && "RESEND_API_KEY is not set: customer emails will only be logged, not sent",
    !env.S3_BUCKET && "S3_BUCKET is not set: uploads go to local disk, which is wiped on redeploy",
    !env.REDIS_URL && "REDIS_URL is not set: events, workflows and locks run in memory only",
    [env.JWT_SECRET, env.COOKIE_SECRET].some((s) => !s || s === "supersecret") &&
      "JWT_SECRET / COOKIE_SECRET are missing or still the template default",
  ]
  for (const problem of problems.filter(Boolean)) {
    console.warn(problem)
  }
}

const emailProvider = mailtrap || env.RESEND_API_KEY
  ? {
      resolve: "./src/modules/resend",
      id: "resend",
      options: {
        channels: ["email"],
        api_key: env.RESEND_API_KEY,
        mailtrap,
        from: env.RESEND_FROM ?? "Ritz & Ron <orders@ritzandron.com.au>",
        reply_to: env.RESEND_REPLY_TO,
      },
    }
  : {
      resolve: "@medusajs/medusa/notification-local",
      id: "local-email",
      options: { channels: ["email"] },
    }

// Supabase Storage via its S3-compatible endpoint; local disk when unset.
const fileModule = env.S3_BUCKET
  ? [
      {
        resolve: "@medusajs/medusa/file",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/file-s3",
              id: "s3",
              options: {
                file_url: env.S3_FILE_URL,
                access_key_id: env.S3_ACCESS_KEY_ID,
                secret_access_key: env.S3_SECRET_ACCESS_KEY,
                region: env.S3_REGION,
                bucket: env.S3_BUCKET,
                endpoint: env.S3_ENDPOINT,
                acl: false,
                additional_client_config: { forcePathStyle: true },
              },
            },
          ],
        },
      },
    ]
  : []

const redisModules = env.REDIS_URL
  ? [
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl: env.REDIS_URL },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { redisUrl: env.REDIS_URL } },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: env.REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    databaseDriverOptions:
      env.DATABASE_SSL === "true"
        ? { connection: { ssl: { rejectUnauthorized: false } } }
        : undefined,
    http: {
      storeCors: env.STORE_CORS!,
      adminCors: env.ADMIN_CORS!,
      authCors: env.AUTH_CORS!,
      jwtSecret: env.JWT_SECRET,
      cookieSecret: env.COOKIE_SECRET,
    },
  },
  admin: {
    backendUrl: env.MEDUSA_BACKEND_URL,
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: { providers: paymentProviders },
    },
    {
      key: Modules.NOTIFICATION,
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          emailProvider,
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: { channels: ["feed"] },
          },
        ],
      },
    },
    ...fileModule,
    ...redisModules,
  ],
})
