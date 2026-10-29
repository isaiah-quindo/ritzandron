import ContactForm from "@modules/content/contact-form"
import SanityPage, { sanityPageMetadata } from "@modules/content/sanity-page"

export const revalidate = 3600

export const generateMetadata = () =>
  sanityPageMetadata("contact", {
    title: "Contact",
    description: "Get in touch with Ritz & Ron about an order, exchange or gift.",
  })

export default function ContactPage() {
  return (
    <SanityPage slug="contact">
      <ContactForm />
    </SanityPage>
  )
}
