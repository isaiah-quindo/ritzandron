import { Section } from "@react-email/components"
import { Button, Heading, Layout, Paragraph, storefrontUrl } from "./layout"
import type { EmailOrder } from "./order-summary"

export function PasswordResetEmail({ url }: { url: string }) {
  return (
    <Layout preview="Reset your Ritz & Ron password">
      <Heading>Reset your password</Heading>
      <Paragraph>
        We received a request to reset the password for your account. This link
        expires in 15 minutes. If you didn't ask for this, you can ignore this
        email.
      </Paragraph>
      <Section style={{ marginTop: "24px", textAlign: "center" }}>
        <Button href={url}>Choose a new password</Button>
      </Section>
    </Layout>
  )
}

export function WelcomeEmail({ firstName }: { firstName?: string | null }) {
  return (
    <Layout preview="Welcome to Ritz & Ron">
      <Heading>Welcome{firstName ? `, ${firstName}` : ""}.</Heading>
      <Paragraph>
        Thank you for joining Ritz &amp; Ron. Your account keeps your orders,
        tracking and addresses in one place, so checkout is quicker next time.
      </Paragraph>
      <Section style={{ marginTop: "24px", textAlign: "center" }}>
        <Button href={`${storefrontUrl()}/store`}>Explore the collection</Button>
      </Section>
    </Layout>
  )
}

export function OrderCanceledEmail({ order }: { order: EmailOrder }) {
  return (
    <Layout preview={`Order #${order.display_id} has been cancelled`}>
      <Heading>Your order has been cancelled</Heading>
      <Paragraph>
        Order #{order.display_id} has been cancelled. If a payment was taken, a
        refund has been issued to your original payment method and should
        appear within 5–10 business days.
      </Paragraph>
      <Paragraph>
        Questions? Simply reply to this email and we'll be happy to help.
      </Paragraph>
    </Layout>
  )
}
