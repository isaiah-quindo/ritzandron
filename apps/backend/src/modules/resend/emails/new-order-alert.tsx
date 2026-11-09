import { Section } from "@react-email/components"
import { Button, Heading, Layout, Paragraph, formatAud } from "./layout"
import { EmailOrder, OrderItems, OrderTotals, ShippingAddress } from "./order-summary"

export const newOrderAlertSubject = (order: EmailOrder) =>
  `New order #${order.display_id} · ${formatAud(order.total)}`

const adminOrderUrl = (order: EmailOrder) =>
  `${process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"}/app/orders/${order.id}`

/** Sent to the shop's own inbox (ORDER_NOTIFY_EMAIL), not the customer. */
export default function NewOrderAlertEmail({ order }: { order: EmailOrder }) {
  const a = order.shipping_address
  const name = [a?.first_name, a?.last_name].filter(Boolean).join(" ")
  return (
    <Layout preview={`${name || order.email} ordered ${formatAud(order.total)}`}>
      <Heading>New order #{order.display_id}</Heading>
      <Paragraph>
        {name ? `${name} · ` : ""}
        {order.email}
        <br />
        Reply to this email to contact the customer.
      </Paragraph>
      <OrderItems order={order} />
      <OrderTotals order={order} />
      <ShippingAddress order={order} />
      <Section style={{ marginTop: "32px", textAlign: "center" }}>
        <Button href={adminOrderUrl(order)}>Open in admin</Button>
      </Section>
    </Layout>
  )
}
