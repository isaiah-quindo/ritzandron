import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { EmailTemplates } from "../modules/resend/service"

type CustomerEvent = { id: string }
type PasswordResetEvent = { entity_id: string; actor_type: string; token: string }

export default async function customerEmailsHandler({
  event,
  container,
}: SubscriberArgs<CustomerEvent | PasswordResetEvent>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  if (event.name === "auth.password_reset") {
    const { entity_id: email, actor_type, token } = event.data as PasswordResetEvent
    const base =
      actor_type === "customer"
        ? `${process.env.STOREFRONT_URL ?? "http://localhost:8000"}/reset-password`
        : `${process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"}/app/reset-password`
    const url = `${base}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

    await notificationModuleService.createNotifications({
      to: email,
      channel: "email",
      template: EmailTemplates.PASSWORD_RESET,
      trigger_type: event.name,
      data: { url },
    })
    return
  }

  const customerModuleService = container.resolve(Modules.CUSTOMER)
  const customer = await customerModuleService.retrieveCustomer(
    (event.data as CustomerEvent).id
  )
  // Guest checkouts also create customers; only welcome registered accounts.
  if (!customer.has_account || !customer.email) {
    return
  }

  await notificationModuleService.createNotifications({
    to: customer.email,
    channel: "email",
    template: EmailTemplates.WELCOME,
    trigger_type: event.name,
    resource_id: customer.id,
    resource_type: "customer",
    idempotency_key: `welcome-${customer.id}`,
    data: { first_name: customer.first_name },
  })
}

export const config: SubscriberConfig = {
  event: ["customer.created", "auth.password_reset"],
}
