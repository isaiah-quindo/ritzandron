import { Section } from "@react-email/components"
import { Button, Heading, Layout, Paragraph, storefrontUrl } from "./layout"
import { EmailOrder, OrderItems, OrderTotals, ShippingAddress } from "./order-summary"

export const orderPlacedSubject = (order: EmailOrder) =>
  `Thank you for your order #${order.display_id}`

// Guests can't open the account pages, so they get the public order page,
// which also shows Australia Post tracking once the order ships.
export const orderUrl = (order: EmailOrder) =>
  order.customer?.has_account
    ? `${storefrontUrl()}/account/orders/details/${order.id}`
    : `${storefrontUrl()}/order/${order.id}/confirmed`

export default function OrderPlacedEmail({ order }: { order: EmailOrder }) {
  const name = order.shipping_address?.first_name
  return (
    <Layout preview={`We've received your order #${order.display_id}`}>
      <Heading>Thank you{name ? `, ${name}` : ""}.</Heading>
      <Paragraph>
        Your order #{order.display_id} is confirmed. We hand-pack every piece in
        NSW and usually dispatch within 1–2 business days. You'll receive
        another email with your Australia Post tracking number as soon as it's
        on its way.
      </Paragraph>
      <OrderItems order={order} />
      <OrderTotals order={order} />
      <ShippingAddress order={order} />
      <Section style={{ marginTop: "32px", textAlign: "center" }}>
        <Button href={orderUrl(order)}>
          View your order
        </Button>
      </Section>
    </Layout>
  )
}
