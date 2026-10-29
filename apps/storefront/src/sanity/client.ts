import "server-only"

import { createClient, type QueryParams } from "next-sanity"
import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url"
import { apiVersion, dataset, isSanityConfigured, projectId } from "./env"

const client = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: process.env.SANITY_API_READ_TOKEN,
      perspective: "published",
    })
  : null

const builder = isSanityConfigured
  ? createImageUrlBuilder({ projectId, dataset })
  : null

export const urlFor = (source: SanityImageSource) =>
  builder!.image(source).auto("format").fit("max")

// The Sanity webhook can't reach localhost, so dev skips the cache and shows
// published changes on the next refresh.
const isDev = process.env.NODE_ENV === "development"

/**
 * Cached GROQ fetch tagged `sanity:<type>` so the Sanity webhook can
 * revalidate exactly what changed. Returns null when Sanity isn't configured.
 */
export async function sanityFetch<T>(
  query: string,
  params: QueryParams = {},
  tags: string[] = []
): Promise<T | null> {
  if (!client) {
    return null
  }
  try {
    return await client.fetch<T>(
      query,
      params,
      isDev
        ? { cache: "no-store" }
        : { next: { tags: ["sanity", ...tags], revalidate: 3600 } }
    )
  } catch (e) {
    console.error("Sanity fetch failed", e)
    return null
  }
}
