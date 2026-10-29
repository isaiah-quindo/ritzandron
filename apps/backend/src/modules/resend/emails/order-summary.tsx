import { Column, Img, Row, Section, Text } from "@react-email/components"
import { brand, formatAud } from "./layout"

export type EmailOrderItem = {
  id: string
  product_title?: string | null
  variant_title?: string | null
  thumbnail?: string | null
  quantity: number | string
  total?: number | string | null
}

export type EmailOrder = {
  id: string
  display_id?: number | string | null
  email?: string | null
  customer?: { has_account?: boolean | null } | null
  items?: EmailOrderItem[] | null
  shipping_address?: {
    first_name?: string | null
    last_name?: string | null
    address_1?: string | null
    address_2?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
  } | null
  item_total?: number | string | null
  shipping_total?: number | string | null
  tax_total?: number | string | null
  discount_total?: number | string | null
  total?: number | string | null
}

const small = {
  fontFamily: brand.sans,
  fontSize: "14px",
  lineHeight: "20px",
  color: brand.charcoal,
  margin: 0,
}

const TotalRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <Row>
    <Column>
      <Text style={{ ...small, fontWeight: bold ? 600 : 400, padding: "4px 0" }}>{label}</Text>
    </Column>
    <Column align="right">
      <Text style={{ ...small, fontWeight: bold ? 600 : 400, padding: "4px 0" }}>{value}</Text>
    </Column>
  </Row>
)

export const OrderItems = ({ order }: { order: EmailOrder }) => (
  <Section>
    {(order.items ?? []).map((item) => (
      <Row key={item.id} style={{ borderBottom: `1px solid ${brand.hairline}` }}>
        <Column width={72} style={{ padding: "12px 0" }}>
          {item.thumbnail ? (
            <Img src={item.thumbnail} width={60} height={60} alt="" style={{ objectFit: "cover" }} />
          ) : null}
        </Column>
        <Column style={{ padding: "12px 8px" }}>
          <Text style={small}>{item.product_title}</Text>
          <Text style={{ ...small, color: brand.muted }}>
            {item.variant_title && item.variant_title !== "Default" ? `${item.variant_title} · ` : ""}
            Qty {Number(item.quantity)}
          </Text>
        </Column>
        <Column align="right" style={{ padding: "12px 0" }}>
          <Text style={small}>{formatAud(item.total)}</Text>
        </Column>
      </Row>
    ))}
  </Section>
)

export const OrderTotals = ({ order }: { order: EmailOrder }) => (
  <Section style={{ marginTop: "16px" }}>
    <TotalRow label="Subtotal" value={formatAud(order.item_total)} />
    {Number(order.discount_total ?? 0) > 0 ? (
      <TotalRow label="Discount" value={`-${formatAud(order.discount_total)}`} />
    ) : null}
    <TotalRow
      label="Shipping"
      value={Number(order.shipping_total ?? 0) === 0 ? "Free" : formatAud(order.shipping_total)}
    />
    <TotalRow label="Total" value={formatAud(order.total)} bold />
    <Text style={{ ...small, color: brand.muted, fontSize: "12px" }}>
      Includes GST of {formatAud(order.tax_total)}
    </Text>
  </Section>
)

export const ShippingAddress = ({ order }: { order: EmailOrder }) => {
  const a = order.shipping_address
  if (!a) {
    return null
  }
  return (
    <Section style={{ marginTop: "24px" }}>
      <Text style={{ ...small, color: brand.muted, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "11px" }}>
        Shipping to
      </Text>
      <Text style={small}>
        {[a.first_name, a.last_name].filter(Boolean).join(" ")}
        <br />
        {a.address_1}
        {a.address_2 ? (
          <>
            <br />
            {a.address_2}
          </>
        ) : null}
        <br />
        {[a.city, a.province, a.postal_code].filter(Boolean).join(" ")}
      </Text>
    </Section>
  )
}
