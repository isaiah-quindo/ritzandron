import { defineArrayMember, defineField, defineType } from "sanity"
import { PageBodyField } from "./page-body-field"

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "instagram", type: "url" }),
    defineField({ name: "tiktok", type: "url" }),
    defineField({ name: "facebook", type: "url" }),
    defineField({
      name: "newsletterHeading",
      type: "string",
      initialValue: "Join the Ritz & Ron circle",
    }),
    defineField({
      name: "newsletterText",
      type: "text",
      rows: 2,
      initialValue:
        "New arrivals, gifting edits and members-only offers. No spam, ever.",
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
})

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  fields: [
    defineField({
      name: "hero",
      type: "object",
      fields: [
        defineField({
          name: "heading",
          type: "string",
          validation: (r) => r.required(),
        }),
        defineField({ name: "text", type: "text", rows: 2 }),
        defineField({ name: "image", type: "imageWithAlt" }),
        defineField({ name: "ctaLabel", type: "string" }),
        defineField({
          name: "ctaHref",
          type: "string",
          description: "e.g. /store or /categories/silver-charms",
        }),
      ],
    }),
    defineField({
      name: "newArrivalsHeading",
      title: "New arrivals heading",
      type: "string",
      description:
        "Heading above the 8 newest products, which come from Medusa automatically",
      initialValue: "New arrivals",
    }),
    defineField({
      name: "categoriesHeading",
      title: "Categories heading",
      type: "string",
      initialValue: "Shop by category",
    }),
    defineField({
      name: "featuredCategories",
      title: "Featured categories",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "title", type: "string" }),
            defineField({
              name: "handle",
              type: "string",
              description: "Medusa category handle, e.g. silver-charms",
            }),
            defineField({ name: "image", type: "imageWithAlt" }),
          ],
          preview: { select: { title: "title", media: "image" } },
        }),
      ],
      validation: (r) => r.max(4),
    }),
    defineField({
      name: "featuredHeading",
      title: "Featured products heading",
      type: "string",
      initialValue: "Our favourites",
    }),
    defineField({
      name: "featuredProducts",
      title: "Featured products",
      type: "array",
      description: "The row is hidden until at least one product is picked",
      of: [defineArrayMember({ type: "reference", to: [{ type: "product" }] })],
    }),
    defineField({
      name: "story",
      title: "Brand story block",
      type: "object",
      fields: [
        defineField({ name: "heading", type: "string" }),
        defineField({ name: "text", type: "text", rows: 4 }),
        defineField({ name: "image", type: "imageWithAlt" }),
        defineField({ name: "ctaLabel", type: "string" }),
        defineField({ name: "ctaHref", type: "string" }),
      ],
    }),
    defineField({
      name: "values",
      title: "Value strip",
      type: "array",
      description:
        "Short selling points along the bottom, e.g. Free shipping over $99. Keep them in step with Medusa's shipping and returns settings.",
      of: [defineArrayMember({ type: "string" })],
      validation: (r) => r.max(4),
    }),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Home page" }) },
})

export const product = defineType({
  name: "product",
  title: "Product story",
  type: "document",
  description:
    "Created automatically from Medusa. Prices and stock are edited in Medusa.",
  fields: [
    defineField({ name: "title", type: "string", readOnly: true }),
    defineField({ name: "handle", type: "slug", readOnly: true }),
    defineField({
      name: "medusaId",
      title: "Medusa ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "thumbnail",
      type: "url",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "status",
      type: "string",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "story",
      type: "richText",
      description: "The story behind the piece",
    }),
    defineField({
      name: "materials",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      description: "e.g. 925 sterling silver, AAA cubic zirconia",
    }),
    defineField({
      name: "careNotes",
      title: "Care notes",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "lifestyleImages",
      title: "Lifestyle images",
      type: "array",
      of: [defineArrayMember({ type: "imageWithAlt" })],
    }),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "handle.current" },
  },
})

export const categoryEditorial = defineType({
  name: "categoryEditorial",
  title: "Category banner",
  type: "document",
  fields: [
    defineField({
      name: "handle",
      type: "string",
      description: "Medusa category handle, e.g. silver-charms",
      validation: (r) => r.required(),
    }),
    defineField({ name: "heading", type: "string" }),
    defineField({ name: "intro", type: "text", rows: 3 }),
    defineField({ name: "image", type: "imageWithAlt" }),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: { select: { title: "heading", subtitle: "handle", media: "image" } },
})

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  description:
    "Our story, Jewellery care, Shipping, Returns, Contact, Privacy and Terms. Each has a fixed entry under Pages.",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Heading shown at the top of the page",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      type: "richText",
      components: { field: PageBodyField },
    }),
    defineField({ name: "seo", type: "seo" }),
  ],
  preview: { select: { title: "title" } },
})

export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({
      name: "question",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({ name: "answer", type: "richText" }),
    defineField({
      name: "group",
      type: "string",
      options: {
        list: ["Orders", "Shipping", "Returns", "Jewellery care", "General"],
      },
    }),
    defineField({ name: "order", type: "number" }),
  ],
  orderings: [
    {
      title: "Order",
      name: "order",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: { select: { title: "question", subtitle: "group" } },
})

export const post = defineType({
  name: "post",
  title: "Journal post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({ name: "excerpt", type: "text", rows: 3 }),
    defineField({ name: "coverImage", type: "imageWithAlt" }),
    defineField({ name: "body", type: "richText" }),
    defineField({ name: "seo", type: "seo" }),
  ],
  orderings: [
    {
      title: "Newest",
      name: "newest",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "publishedAt", media: "coverImage" },
  },
})
