import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { getOrderForEmail } from "../lib/order-email"
import { EmailTemplates } from "../modules/resend/service"

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  const order = await getOrderForEmail(container, data.id)
  if (!order?.email) {
    return
  }

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: EmailTemplates.ORDER_CANCELED,
    trigger_type: "order.canceled",
    resource_id: order.id,
    resource_type: "order",
    idempotency_key: `order-canceled-${order.id}`,
    data: { order },
  })
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
