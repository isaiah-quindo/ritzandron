import { STORE_NAME } from "@lib/util/site"
import SanityPage, { sanityPageMetadata } from "@modules/content/sanity-page"

export const dynamic = "force-static"
export const revalidate = 60

export const generateMetadata = () =>
  sanityPageMetadata("privacy", {
    title: "Privacy policy",
    description: `How ${STORE_NAME} collects and uses personal data.`,
  })

export default function PrivacyPage() {
  return <SanityPage slug="privacy" />
}
