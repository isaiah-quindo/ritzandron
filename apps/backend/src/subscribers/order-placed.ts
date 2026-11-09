import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { getOrderForEmail } from "../lib/order-email"
import { EmailTemplates } from "../modules/resend/service"

// The shop's own inbox(es) for new-order alerts, comma-separated.
const shopRecipients = () =>
  (process.env.ORDER_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean)

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  const order = await getOrderForEmail(container, data.id)
  if (!order) {
    logger.warn(`Order ${data.id} not found; skipping order emails`)
    return
  }

  const notifications = shopRecipients().map((to) => ({
    to,
    channel: "email",
    template: EmailTemplates.NEW_ORDER_ALERT,
    trigger_type: "order.placed",
    resource_id: order.id,
    resource_type: "order",
    idempotency_key: `new-order-alert-${order.id}-${to}`,
    data: { order },
  }))

  if (order.email) {
    notifications.unshift({
      to: order.email,
      channel: "email",
      template: EmailTemplates.ORDER_PLACED,
      trigger_type: "order.placed",
      resource_id: order.id,
      resource_type: "order",
      idempotency_key: `order-placed-${order.id}`,
      data: { order },
    })
  } else {
    logger.warn(`Order ${data.id} has no email; skipping confirmation`)
  }

  if (notifications.length) {
    await notificationModuleService.createNotifications(notifications)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
