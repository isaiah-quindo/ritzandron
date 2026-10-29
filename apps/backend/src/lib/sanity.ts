import { createClient, type SanityClient } from "@sanity/client"

let client: SanityClient | null = null

/** Returns null when Sanity isn't configured so local dev works without it. */
export function getSanityClient(): SanityClient | null {
  if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_WRITE_TOKEN) {
    return null
  }
  client ??= createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET ?? "production",
    token: process.env.SANITY_WRITE_TOKEN,
    apiVersion: "2025-01-01",
    useCdn: false,
  })
  return client
}

export const sanityProductId = (medusaId: string) => `product-${medusaId}`

export type SyncableProduct = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
  status?: string
}

/**
 * Medusa owns title/handle/thumbnail; editors own everything else on the
 * Sanity document, so only those fields are written.
 */
export async function upsertSanityProduct(sanity: SanityClient, product: SyncableProduct) {
  const _id = sanityProductId(product.id)
  const owned = {
    medusaId: product.id,
    title: product.title,
    handle: { _type: "slug", current: product.handle },
    thumbnail: product.thumbnail ?? null,
    status: product.status ?? null,
  }
  await sanity
    .transaction()
    .createIfNotExists({ _id, _type: "product", ...owned })
    .patch(_id, (p) => p.set(owned))
    .commit()
}

/** Asks the storefront to drop cached product pages. */
export async function revalidateStorefront(tags: string[]) {
  const url = process.env.STOREFRONT_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) {
    return
  }
  await fetch(`${url}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-revalidate-secret": secret },
    body: JSON.stringify({ tags }),
  }).catch(() => undefined)
}
