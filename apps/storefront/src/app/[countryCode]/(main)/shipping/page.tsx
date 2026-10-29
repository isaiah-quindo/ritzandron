import { getStorePolicies } from "@lib/data/store-policies"
import SanityPage, { sanityPageMetadata } from "@modules/content/sanity-page"
import {
  PoliciesUnavailable,
  ShippingSummary,
} from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const generateMetadata = () =>
  sanityPageMetadata("shipping", {
    title: "Shipping information",
    description: "Shipping rates and delivery times.",
  })

export default async function ShippingPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current, currencyCode } = await getStorePolicies(countryCode)

  return (
    <SanityPage slug="shipping">
      {current ? (
        <ShippingSummary policies={current} currencyCode={currencyCode} />
      ) : (
        <PoliciesUnavailable />
      )}
    </SanityPage>
  )
}
