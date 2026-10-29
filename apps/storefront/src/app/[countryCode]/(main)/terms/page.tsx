import { STORE_NAME } from "@lib/util/site"
import SanityPage, { sanityPageMetadata } from "@modules/content/sanity-page"

export const dynamic = "force-static"
export const revalidate = 60

export const generateMetadata = () =>
  sanityPageMetadata("terms", {
    title: "Terms of service",
    description: `Terms that apply to purchases from ${STORE_NAME}.`,
  })

export default function TermsPage() {
  return <SanityPage slug="terms" />
}
