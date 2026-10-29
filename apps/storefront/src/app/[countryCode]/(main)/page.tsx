import { Metadata } from "next"

import { getHomePage } from "@cms/queries"
import { socialImageMetadata } from "@modules/content/sanity-page"
import BrandStory from "@modules/home/components/brand-story"
import CategoryTiles from "@modules/home/components/category-tiles"
import Hero from "@modules/home/components/hero"
import ProductRow from "@modules/home/components/product-row"
import ValueProps from "@modules/home/components/value-props"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { toJsonLd } from "@lib/util/product-structured-data"
import { getSiteOrigin, STORE_NAME } from "@lib/util/site"
import { buildRegionsReturnPolicies } from "@lib/util/store-policies"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [origin, home] = await Promise.all([getSiteOrigin(), getHomePage()])
  const title =
    home?.seo?.title || "Ritz & Ron | Sterling Silver Jewellery & Charms"
  const description =
    home?.seo?.description ||
    "Sterling silver charms, charm bracelets, earrings and necklaces. Australian owned, shipped from NSW with free shipping over $99."

  return {
    title: { absolute: title },
    description,
    ...socialImageMetadata(home?.seo?.image, title, description),
    alternates: {
      canonical: origin,
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const home = await getHomePage()
  const featuredHandles = home?.featuredProductHandles?.filter(Boolean) ?? []

  const [newArrivals, featured] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: { limit: 8, order: "-created_at" },
    }).then(({ response }) => response.products),
    featuredHandles.length
      ? listProducts({
          countryCode,
          queryParams: { handle: featuredHandles, limit: featuredHandles.length },
        }).then(({ response }) =>
          // Keep the order editors chose in Sanity.
          featuredHandles
            .map((h) => response.products.find((p) => p.handle === h))
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
        )
      : Promise.resolve([]),
  ])

  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])
  const homeUrl = origin
  const returnPolicies = buildRegionsReturnPolicies(regions)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: STORE_NAME,
      url: origin,
      ...(returnPolicies.length
        ? { hasMerchantReturnPolicy: returnPolicies }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: STORE_NAME,
      url: homeUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${homeUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
      <Hero hero={home?.hero} />
      <ProductRow
        title={home?.newArrivalsHeading || "New arrivals"}
        products={newArrivals}
        region={region}
      />
      <CategoryTiles
        heading={home?.categoriesHeading}
        categories={home?.featuredCategories}
      />
      <ProductRow
        title={home?.featuredHeading || "Our favourites"}
        products={featured}
        region={region}
      />
      <BrandStory story={home?.story} />
      <ValueProps values={home?.values} />
    </>
  )
}
