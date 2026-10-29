import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { getOrderForEmail } from "../lib/order-email"
import { EmailTemplates } from "../modules/resend/service"

/**
 * Dev only: sends sample emails through the real notification provider so the
 * templates can be checked in the Mailtrap inbox:
 * `npx medusa exec ./src/scripts/send-test-emails.ts`
 *
 * Refuses to run without Mailtrap so it can never email a real address via
 * Resend. Uses the most recent order for the order confirmation.
 */
export default async function sendTestEmails({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (process.env.NODE_ENV === "production") {
    logger.error("Not available in production, where Mailtrap is disabled")
    return
  }
  if (!process.env.MAILTRAP_API_TOKEN || !process.env.MAILTRAP_INBOX_ID) {
    logger.error("MAILTRAP_API_TOKEN and MAILTRAP_INBOX_ID must be set")
    return
  }

  const notifications = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const to = "test@example.com"
  const storefront = process.env.STOREFRONT_URL ?? "http://localhost:8000"

  const {
    data: [latest],
  } = await query.graph({
    entity: "order",
    fields: ["id"],
    pagination: { order: { created_at: "DESC" }, take: 1 },
  })
  const order = latest ? await getOrderForEmail(container, latest.id) : null

  const samples = [
    ...(order
      ? [{ template: EmailTemplates.ORDER_PLACED, data: { order } }]
      : []),
    { template: EmailTemplates.WELCOME, data: { first_name: "Sample" } },
    {
      template: EmailTemplates.PASSWORD_RESET,
      data: { url: `${storefront}/reset-password?token=sample&email=${to}` },
    },
  ]

  for (const { template, data } of samples) {
    const [sent] = await notifications.createNotifications([
      { to, channel: "email", template, trigger_type: "test", data },
    ])
    logger.info(`${template}: ${sent?.status ?? "unknown"}`)
  }
  if (!order) {
    logger.warn("No orders found, so the order confirmation was skipped")
  }
}
