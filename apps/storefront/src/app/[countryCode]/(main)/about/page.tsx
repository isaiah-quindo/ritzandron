import SanityPage, { sanityPageMetadata } from "@modules/content/sanity-page"

export const revalidate = 3600

export const generateMetadata = () =>
  sanityPageMetadata("about", {
    title: "Our story",
    description: "Ritz & Ron is an Australian-owned sterling silver jewellery brand founded in NSW in 2020.",
  })

export default function AboutPage() {
  return <SanityPage slug="about" />
}
