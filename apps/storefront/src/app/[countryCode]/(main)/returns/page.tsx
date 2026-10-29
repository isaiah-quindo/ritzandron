import { getStorePolicies } from "@lib/data/store-policies"
import SanityPage, { sanityPageMetadata } from "@modules/content/sanity-page"
import {
  PoliciesUnavailable,
  ReturnsSummary,
} from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const generateMetadata = () =>
  sanityPageMetadata("returns", {
    title: "Returns & exchanges",
    description: "Our exchange policy and how to return a faulty item.",
  })

export default async function ReturnsPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current } = await getStorePolicies(countryCode)

  return (
    <SanityPage slug="returns">
      {current ? <ReturnsSummary policies={current} /> : <PoliciesUnavailable />}
    </SanityPage>
  )
}
