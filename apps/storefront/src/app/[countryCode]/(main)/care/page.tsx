import SanityPage, { sanityPageMetadata } from "@modules/content/sanity-page"

export const revalidate = 3600

export const generateMetadata = () =>
  sanityPageMetadata("care", {
    title: "Caring for your silver",
    description:
      "How to store, clean and protect your sterling silver jewellery from tarnish.",
  })

export default function CarePage() {
  return <SanityPage slug="care" />
}
