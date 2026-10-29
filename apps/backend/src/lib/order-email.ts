import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const ORDER_EMAIL_FIELDS = [
  "id",
  "display_id",
  "email",
  "item_total",
  "shipping_total",
  "tax_total",
  "discount_total",
  "total",
  "items.id",
  "items.product_title",
  "items.variant_title",
  "items.thumbnail",
  "items.quantity",
  "items.total",
  "shipping_address.*",
  "customer.has_account",
]

export const AUSPOST_TRACKING_URL = "https://auspost.com.au/mypost/track/details/"

/**
 * The admin "Mark as shipped" form stores `#` when no URL is entered, so any
 * label without a real URL gets the Australia Post tracking page.
 */
export const trackingUrlFor = (trackingNumber: string, url?: string | null) =>
  url && url !== "#" && /^https?:\/\//.test(url)
    ? url
    : `${AUSPOST_TRACKING_URL}${encodeURIComponent(trackingNumber.trim())}`

export async function getOrderForEmail(container: MedusaContainer, orderId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ORDER_EMAIL_FIELDS,
    filters: { id: orderId },
  })
  return order
}
