import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getSanityClient, upsertSanityProduct } from "../lib/sanity"

/** Backfills every Medusa product into Sanity: `npx medusa exec ./src/scripts/sync-sanity.ts` */
export default async function syncSanity({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const sanity = getSanityClient()
  if (!sanity) {
    logger.error("SANITY_PROJECT_ID and SANITY_WRITE_TOKEN must be set")
    return
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "thumbnail", "status"],
  })

  for (const product of products) {
    await upsertSanityProduct(sanity, product)
  }
  logger.info(`Synced ${products.length} products to Sanity`)
}
