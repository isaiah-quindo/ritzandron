import { groq } from "next-sanity"
import type { PortableTextBlock } from "@portabletext/react"
import type { SanityImageSource } from "@sanity/image-url"
import { sanityFetch } from "./client"
import { pageDocumentId, type ContentPageSlug } from "./pages"

export type SanityImage = SanityImageSource & { alt?: string }

export type SiteSettings = {
  instagram?: string
  tiktok?: string
  facebook?: string
  newsletterHeading?: string
  newsletterText?: string
}

export type HomePage = {
  hero?: {
    heading?: string
    text?: string
    image?: SanityImage
    ctaLabel?: string
    ctaHref?: string
  }
  featuredCategories?: {
    title?: string
    handle?: string
    image?: SanityImage
  }[]
  featuredProductHandles?: string[]
  story?: {
    heading?: string
    text?: string
    image?: SanityImage
    ctaLabel?: string
    ctaHref?: string
  }
  newArrivalsHeading?: string
  categoriesHeading?: string
  featuredHeading?: string
  values?: string[]
  seo?: Seo
}

export type ProductStory = {
  story?: PortableTextBlock[]
  materials?: string[]
  careNotes?: string
  lifestyleImages?: SanityImage[]
  seo?: { title?: string; description?: string }
}

export type CategoryEditorial = {
  heading?: string
  intro?: string
  image?: SanityImage
}

export type Seo = { title?: string; description?: string; image?: SanityImage }

export type ContentPage = {
  title: string
  body?: PortableTextBlock[]
  seo?: Seo
}

export type Faq = {
  _id: string
  question: string
  answer?: PortableTextBlock[]
  group?: string
}

export type PostSummary = {
  _id: string
  title: string
  slug: string
  publishedAt?: string
  excerpt?: string
  coverImage?: SanityImage
}

export type Post = PostSummary & { body?: PortableTextBlock[] }

export const getSiteSettings = () =>
  sanityFetch<SiteSettings>(groq`*[_id == "siteSettings"][0]`, {}, [
    "sanity:siteSettings",
  ])

export const getHomePage = () =>
  sanityFetch<HomePage>(
    groq`*[_id == "homePage"][0]{
      hero, featuredCategories, story, values, seo,
      newArrivalsHeading, categoriesHeading, featuredHeading,
      "featuredProductHandles": featuredProducts[]->handle.current
    }`,
    {},
    ["sanity:homePage", "sanity:product"]
  )

/**
 * Matched by Medusa product ID, not handle: the backend sync names each story
 * `product-<medusaId>`, which is unique even when two stories share a handle.
 */
export const getProductStory = (medusaId: string) =>
  sanityFetch<ProductStory>(
    groq`*[_id == $id][0]{
      story, materials, careNotes, lifestyleImages, seo
    }`,
    { id: `product-${medusaId}` },
    ["sanity:product"]
  )

export const getCategoryEditorial = (handle: string) =>
  sanityFetch<CategoryEditorial>(
    groq`*[_type == "categoryEditorial" && handle == $handle][0]{ heading, intro, image }`,
    { handle },
    ["sanity:categoryEditorial"]
  )

export const getPage = (slug: ContentPageSlug) =>
  sanityFetch<ContentPage>(
    groq`*[_id == $id][0]{ title, body, seo }`,
    { id: pageDocumentId(slug) },
    ["sanity:page"]
  )

export const getFaqs = () =>
  sanityFetch<Faq[]>(
    groq`*[_type == "faq"] | order(order asc){ _id, question, answer, group }`,
    {},
    ["sanity:faq"]
  )

export const getPosts = () =>
  sanityFetch<PostSummary[]>(
    groq`*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
      _id, title, "slug": slug.current, publishedAt, excerpt, coverImage
    }`,
    {},
    ["sanity:post"]
  )

export const getPost = (slug: string) =>
  sanityFetch<Post>(
    groq`*[_type == "post" && slug.current == $slug][0]{
      _id, title, "slug": slug.current, publishedAt, excerpt, coverImage, body
    }`,
    { slug },
    ["sanity:post"]
  )
