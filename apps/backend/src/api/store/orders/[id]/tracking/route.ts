import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { trackingUrlFor } from "../../../../../lib/order-email"

/**
 * Tracking numbers for an order. The core store order route doesn't expose
 * fulfillment labels, so the storefront reads them here. Order IDs are
 * unguessable, matching how the core route exposes guest orders.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "fulfillments.shipped_at", "fulfillments.labels.tracking_number", "fulfillments.labels.tracking_url"],
    filters: { id: req.params.id },
  })

  if (!order) {
    res.status(404).json({ message: "Order not found" })
    return
  }

  const tracking = (order.fulfillments ?? [])
    .flatMap((f) =>
      (f?.labels ?? []).map((label) => ({
        tracking_number: label?.tracking_number?.trim() ?? "",
        tracking_url: label?.tracking_number
          ? trackingUrlFor(label.tracking_number, label.tracking_url)
          : "",
        shipped_at: f?.shipped_at ?? null,
      }))
    )
    .filter((t) => t.tracking_number)

  res.json({ tracking })
}
