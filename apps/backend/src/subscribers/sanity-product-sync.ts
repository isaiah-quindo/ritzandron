import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  getSanityClient,
  revalidateStorefront,
  sanityProductId,
  upsertSanityProduct,
} from "../lib/sanity"

export default async function sanityProductSyncHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const sanity = getSanityClient()

  try {
    if (sanity && event.name === "product.deleted") {
      // Also remove any unpublished edits so no orphaned draft is left behind.
      const id = sanityProductId(event.data.id)
      await sanity.transaction().delete(id).delete(`drafts.${id}`).commit()
    } else if (sanity) {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const {
        data: [product],
      } = await query.graph({
        entity: "product",
        fields: ["id", "title", "handle", "thumbnail", "status"],
        filters: { id: event.data.id },
      })
      if (product) {
        await upsertSanityProduct(sanity, product)
      }
    }
  } catch (error) {
    logger.error(`Sanity sync failed for product ${event.data.id}: ${(error as Error).message}`)
  }

  await revalidateStorefront(["products", "variants", "categories", "collections"])
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
