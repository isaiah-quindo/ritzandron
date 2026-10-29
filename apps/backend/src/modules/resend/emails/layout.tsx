import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import type { ReactNode } from "react"

export const brand = {
  paper: "#FFFFFF",
  charcoal: "#141414",
  muted: "#6F6F6F",
  hairline: "#E8E8E8",
  // Logo face; clients that block web fonts fall back to Times.
  logo: "'Instrument Serif', 'Times New Roman', serif",
  sans: "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
}

export const storefrontUrl = () =>
  process.env.STOREFRONT_URL ?? "http://localhost:8000"

export const formatAud = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    Number(amount ?? 0)
  )

export const Heading = ({ children }: { children: ReactNode }) => (
  <Text
    style={{
      fontFamily: brand.sans,
      fontSize: "26px",
      lineHeight: "32px",
      fontWeight: 400,
      letterSpacing: "-0.03em",
      color: brand.charcoal,
      margin: "0 0 16px",
    }}
  >
    {children}
  </Text>
)

export const Paragraph = ({ children }: { children: ReactNode }) => (
  <Text
    style={{
      fontFamily: brand.sans,
      fontSize: "15px",
      lineHeight: "24px",
      color: brand.charcoal,
      margin: "0 0 16px",
    }}
  >
    {children}
  </Text>
)

export const Button = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link
    href={href}
    style={{
      display: "inline-block",
      backgroundColor: brand.charcoal,
      color: brand.paper,
      fontFamily: brand.sans,
      fontSize: "14px",
      fontWeight: 500,
      textDecoration: "none",
      borderRadius: "4px",
      padding: "12px 22px",
    }}
  >
    {children}
  </Link>
)

export const Layout = ({
  preview,
  children,
}: {
  preview: string
  children: ReactNode
}) => (
  <Html lang="en">
    <Head>
      <Font
        fontFamily="Instrument Serif"
        fallbackFontFamily="Georgia"
        webFont={{
          url: "https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTjg.woff2",
          format: "woff2",
        }}
      />
      <Font
        fontFamily="Instrument Serif"
        fallbackFontFamily="Georgia"
        fontStyle="italic"
        webFont={{
          url: "https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zAjjH7M.woff2",
          format: "woff2",
        }}
      />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={{ backgroundColor: brand.paper, margin: 0, padding: "32px 0" }}>
      <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 24px" }}>
        <Section style={{ padding: "8px 0 24px" }}>
          <Link
            href={storefrontUrl()}
            style={{
              fontFamily: brand.logo,
              fontSize: "28px",
              textTransform: "uppercase",
              color: brand.charcoal,
              textDecoration: "none",
            }}
          >
            Ritz <i style={{ textTransform: "none" }}>&amp;</i> Ron
          </Link>
        </Section>
        <Hr style={{ borderColor: brand.hairline, margin: "0 0 32px" }} />
        {children}
        <Hr style={{ borderColor: brand.hairline, margin: "32px 0 16px" }} />
        <Text
          style={{
            fontFamily: brand.sans,
            fontSize: "12px",
            lineHeight: "18px",
            color: brand.muted,
          }}
        >
          Ritz &amp; Ron · Sterling silver jewellery, made to be treasured.
          <br />
          Australian owned · Ships from NSW
        </Text>
      </Container>
    </Body>
  </Html>
)
