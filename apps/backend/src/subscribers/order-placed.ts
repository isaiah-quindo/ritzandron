import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { getOrderForEmail } from "../lib/order-email"
import { EmailTemplates } from "../modules/resend/service"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  const order = await getOrderForEmail(container, data.id)
  if (!order?.email) {
    logger.warn(`Order ${data.id} has no email; skipping confirmation`)
    return
  }

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: EmailTemplates.ORDER_PLACED,
    trigger_type: "order.placed",
    resource_id: order.id,
    resource_type: "order",
    idempotency_key: `order-placed-${order.id}`,
    data: { order },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
