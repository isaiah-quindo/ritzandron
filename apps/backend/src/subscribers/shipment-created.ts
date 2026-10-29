import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { getOrderForEmail, trackingUrlFor } from "../lib/order-email"
import { EmailTemplates } from "../modules/resend/service"

/**
 * Staff mark a fulfillment as shipped in the admin and type the Australia Post
 * tracking number; this emails the customer their tracking link.
 */
export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (data.no_notification) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  const {
    data: [fulfillment],
  } = await query.graph({
    entity: "fulfillment",
    fields: ["id", "labels.tracking_number", "labels.tracking_url", "order.id"],
    filters: { id: data.id },
  })

  const orderId = fulfillment?.order?.id
  if (!orderId) {
    logger.warn(`Fulfillment ${data.id} has no order; skipping shipment email`)
    return
  }

  const order = await getOrderForEmail(container, orderId)
  if (!order?.email) {
    return
  }

  const tracking = (fulfillment.labels ?? [])
    .filter((label) => label?.tracking_number?.trim())
    .map((label) => ({
      tracking_number: label!.tracking_number.trim(),
      tracking_url: trackingUrlFor(label!.tracking_number, label!.tracking_url),
    }))

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: EmailTemplates.ORDER_SHIPPED,
    trigger_type: "shipment.created",
    resource_id: order.id,
    resource_type: "order",
    idempotency_key: `shipment-created-${fulfillment.id}`,
    data: { order, tracking },
  })
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
