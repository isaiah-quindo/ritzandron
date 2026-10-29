/**
 * Content pages edited in Sanity. Each is one `page` document with a fixed
 * `_id` of `page-<slug>`, so the Studio sidebar and the storefront route can't
 * drift apart. Add an entry here and a matching route to create a new page.
 */
export const contentPages = [
  { slug: "about", title: "Our story" },
  { slug: "care", title: "Jewellery care" },
  { slug: "shipping", title: "Shipping" },
  { slug: "returns", title: "Returns & exchanges" },
  { slug: "contact", title: "Contact" },
  { slug: "privacy", title: "Privacy policy" },
  { slug: "terms", title: "Terms of service" },
] as const

export type ContentPageSlug = (typeof contentPages)[number]["slug"]

export const pageDocumentId = (slug: ContentPageSlug) => `page-${slug}`
