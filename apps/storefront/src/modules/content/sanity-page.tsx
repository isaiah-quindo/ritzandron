import { urlFor } from "@cms/client"
import { getPage, type SanityImage } from "@cms/queries"
import { contentPages, type ContentPageSlug } from "@cms/pages"
import { STORE_NAME } from "@lib/util/site"
import RichText from "@modules/common/components/rich-text"
import { PolicyPage } from "@modules/policies/templates"
import type { Metadata } from "next"

const defaultTitle = (slug: ContentPageSlug) =>
  contentPages.find((p) => p.slug === slug)!.title

/**
 * Renders the published Sanity page for this slug, or a short notice until
 * editors publish it. `children` render below the body for content that comes
 * from code, such as live Medusa policy values or the contact form.
 */
export default async function SanityPage({
  slug,
  children,
}: {
  slug: ContentPageSlug
  children?: React.ReactNode
}) {
  const page = await getPage(slug)

  return (
    <PolicyPage title={page?.title ?? defaultTitle(slug)}>
      {page?.body?.length ? (
        <div>
          <RichText value={page.body} />
        </div>
      ) : (
        <p className="text-ui-fg-subtle" data-testid="page-coming-soon">
          This page is coming soon.
        </p>
      )}
      {children}
    </PolicyPage>
  )
}

/**
 * Share tags for an SEO image set in Sanity. Empty without one, so the default
 * `app/opengraph-image.jpg` and `app/twitter-image.jpg` still apply.
 */
export function socialImageMetadata(
  image: SanityImage | undefined,
  title: string,
  description?: string | null
): Metadata {
  if (!image || typeof image !== "object" || !("asset" in image) || !image.asset) {
    return {}
  }
  const images = [
    {
      url: urlFor(image).width(1200).height(630).fit("crop").url(),
      width: 1200,
      height: 630,
      alt: image.alt ?? title,
    },
  ]
  const shared = { title, description: description ?? undefined, images }
  return {
    openGraph: shared,
    twitter: { card: "summary_large_image", ...shared },
  }
}

export async function sanityPageMetadata(
  slug: ContentPageSlug,
  fallback: Metadata
): Promise<Metadata> {
  const page = await getPage(slug)
  const title = page?.seo?.title ?? page?.title ?? fallback.title
  const description = page?.seo?.description ?? fallback.description
  return {
    ...fallback,
    title,
    description,
    ...socialImageMetadata(
      page?.seo?.image,
      `${String(title)} | ${STORE_NAME}`,
      description
    ),
  }
}
