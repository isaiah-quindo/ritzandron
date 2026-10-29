/**
 * The single region this store sells in. It's an internal route segment
 * (`app/[countryCode]`) only and never appears in URLs; see middleware.ts.
 * Kept free of server-only imports so middleware can use it.
 */
export const DEFAULT_COUNTRY_CODE = (
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "au"
).toLowerCase()
