import { Link, Section, Text } from "@react-email/components"
import { brand, Button, Heading, Layout, Paragraph } from "./layout"
import { EmailOrder, OrderItems, ShippingAddress } from "./order-summary"

export type EmailTracking = {
  tracking_number: string
  tracking_url: string
}

export const orderShippedSubject = (order: EmailOrder) =>
  `Your order #${order.display_id} is on its way`

export default function OrderShippedEmail({
  order,
  tracking,
}: {
  order: EmailOrder
  tracking: EmailTracking[]
}) {
  const primary = tracking[0]
  return (
    <Layout preview={`Your order #${order.display_id} has shipped with Australia Post`}>
      <Heading>Your order is on its way.</Heading>
      <Paragraph>
        Good news — order #{order.display_id} has been packed with care and
        handed to Australia Post. Most orders arrive within 2–7 business days.
      </Paragraph>
      {tracking.length ? (
        <Section
          style={{
            border: `1px solid ${brand.hairline}`,
            padding: "20px",
            margin: "8px 0 24px",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              fontFamily: brand.sans,
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: brand.muted,
              margin: "0 0 8px",
            }}
          >
            Australia Post tracking
          </Text>
          {tracking.map((t) => (
            <Text
              key={t.tracking_number}
              style={{ fontFamily: brand.sans, fontSize: "16px", color: brand.charcoal, margin: "0 0 4px" }}
            >
              <Link href={t.tracking_url} style={{ color: brand.charcoal }}>
                {t.tracking_number}
              </Link>
            </Text>
          ))}
          <Section style={{ marginTop: "16px" }}>
            <Button href={primary.tracking_url}>Track parcel</Button>
          </Section>
        </Section>
      ) : null}
      <OrderItems order={order} />
      <ShippingAddress order={order} />
    </Layout>
  )
}
