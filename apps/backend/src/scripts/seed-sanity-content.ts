import { randomUUID } from "node:crypto"
import { createReadStream } from "node:fs"
import path from "node:path"
import type { IdentifiedSanityDocumentStub, SanityClient } from "@sanity/client"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getSanityClient } from "../lib/sanity"

/**
 * One-off: copies the storefront's former built-in homepage, page and FAQ copy into
 * Sanity as drafts for editors to review and publish:
 * `npx medusa exec ./src/scripts/seed-sanity-content.ts`
 *
 * A document is skipped when a draft or published version already exists, so
 * re-running never overwrites editors' work. Privacy and Terms are left out on
 * purpose: the old copy was a generic placeholder that needs real legal text.
 */

const key = () => randomUUID().replace(/-/g, "").slice(0, 12)

const span = (text: string) => ({ _type: "span", _key: key(), text, marks: [] })

const block = (text: string, style = "normal") => ({
  _type: "block",
  _key: key(),
  style,
  markDefs: [],
  children: [span(text)],
})

const bullet = (text: string) => ({ ...block(text), listItem: "bullet", level: 1 })

const p = (text: string) => block(text)
const h3 = (text: string) => block(text, "h3")

const pages = [
  {
    slug: "about",
    title: "Our story",
    body: [
      p(
        "Ritz & Ron was founded in 2020 in New South Wales by Ritz and Eron, with a simple idea: jewellery should help you hold on to the moments that matter. A charm for a birthday, a birthstone for a new arrival, a little heart for someone you love."
      ),
      p(
        "Every piece in our collection is 925 sterling silver, nickel-free and hypoallergenic, and hand-picked by us. We pack each order ourselves and send it from NSW with Australia Post, ready to give or to keep."
      ),
      p("Thank you for supporting a small Australian business. Happy silvers!"),
    ],
  },
  {
    slug: "care",
    title: "Caring for your silver",
    body: [
      p(
        "Sterling silver naturally darkens over time when it meets air and moisture. With a little care, your pieces will stay bright for years."
      ),
      h3("Everyday wear"),
      bullet("Put jewellery on last, after perfume, lotion and hairspray."),
      bullet("Take it off before swimming, showering, exercising or cleaning."),
      bullet("Wearing silver often actually helps, as natural oils slow tarnish."),
      h3("Storage"),
      bullet("Store each piece separately in its pouch or gift box."),
      bullet("Keep it somewhere cool and dry, not the bathroom."),
      bullet("An anti-tarnish strip in your jewellery box makes a big difference."),
      h3("Cleaning"),
      p(
        "Polish gently with a soft silver cloth. For charms with stones or crystals, avoid dips and harsh chemicals. A cloth is all you need."
      ),
    ],
  },
  {
    slug: "shipping",
    title: "Shipping",
    body: [
      p(
        "Every order is packed by hand in NSW and sent with tracked Australia Post. Parcel Post is free on orders over $99."
      ),
      p(
        "Express Post is also available at checkout for delivery 1-3 business days after dispatch. As soon as your parcel ships, we'll email your tracking number."
      ),
      p("We currently ship within Australia only."),
    ],
  },
  {
    slug: "returns",
    title: "Returns & exchanges",
    body: [
      p(
        "We want you to love your Ritz & Ron piece. If it's not quite right, you can exchange it within the exchange window shown below."
      ),
      bullet("Items must be unworn, in new condition and in their original packaging."),
      bullet("Return postage is paid by the customer; we cover sending your exchange."),
      bullet("For hygiene reasons, earrings for pierced ears can't be exchanged."),
      h3("Faulty or incorrect items"),
      p(
        "If your item arrives damaged, faulty or isn't what you ordered, contact us within 7 days of delivery with your order number and a photo. We'll arrange a replacement or a full refund, including postage. This doesn't affect your rights under Australian Consumer Law."
      ),
      h3("How to start an exchange"),
      p(
        "Reply to your order confirmation email or use our contact form with your order number and the piece you'd like instead."
      ),
    ],
  },
  {
    slug: "contact",
    title: "Get in touch",
    body: [
      p(
        "Questions about an order, an exchange or finding the perfect gift? Send us a message and we'll reply within one business day. For orders, please include your order number."
      ),
    ],
  },
]

const faqs = [
  {
    slug: "when-will-my-order-ship",
    group: "Shipping",
    question: "When will my order ship?",
    answer:
      "Orders are processed within 1-2 business days and sent with Australia Post. Parcel Post takes 2-7 business days to arrive; Express Post 1-3. You'll get an email with your tracking number as soon as it's on its way.",
  },
  {
    slug: "free-shipping",
    group: "Shipping",
    question: "Do you offer free shipping?",
    answer: "Yes. Parcel Post is free Australia-wide on orders over $99.",
  },
  {
    slug: "cancel-or-change-order",
    group: "Orders",
    question: "Can I cancel or change my order?",
    answer:
      "You can cancel or change your order any time before it ships. Just reply to your order confirmation email.",
  },
  {
    slug: "exchange-policy",
    group: "Returns",
    question: "What is your exchange policy?",
    answer:
      "Unworn pieces in their original packaging can be exchanged within 30 days of dispatch. Return postage is paid by the customer. For hygiene reasons, earrings for pierced ears can't be exchanged. Refunds are given for faulty or incorrect items.",
  },
  {
    slug: "hypoallergenic",
    group: "Jewellery care",
    question: "Is your jewellery hypoallergenic?",
    answer:
      "Our pieces are 925 sterling silver and nickel-free, so they're suitable for most sensitive skin.",
  },
  {
    slug: "charm-compatibility",
    group: "General",
    question: "Are your charms compatible with other bracelets?",
    answer:
      "Our charms fit most popular snake-chain charm bracelets with a standard 3mm chain.",
  },
]

// Unsplash stand-ins (see storefront/public/placeholders/CREDITS.md). They
// show other makers' jewellery, so editors must swap them before launch.
const placeholderDir = path.resolve(process.cwd(), "../storefront/public/placeholders")

const uploadImage = async (sanity: SanityClient, file: string, alt: string) => {
  const asset = await sanity.assets.upload(
    "image",
    createReadStream(path.join(placeholderDir, file)),
    { filename: file }
  )
  return {
    _type: "imageWithAlt",
    asset: { _type: "reference", _ref: asset._id },
    alt,
  }
}

const categoryTiles = [
  { title: "Silver charms", handle: "silver-charms", file: "category-charms.jpg" },
  { title: "Charm bracelets", handle: "charm-bracelets", file: "category-bracelets.jpg" },
  { title: "Earrings", handle: "earrings", file: "category-earrings.jpg" },
  { title: "Necklaces", handle: "necklaces", file: "category-necklaces.jpg" },
]

const buildHomePage = async (sanity: SanityClient) => ({
  _id: "homePage",
  _type: "homePage",
  hero: {
    heading: "Little treasures for every story",
    text: "925 sterling silver charms, bracelets and earrings. Nickel-free and gift-ready.",
    image: await uploadImage(sanity, "hero.jpg", "Silver bracelets on two arms"),
    ctaLabel: "Shop new arrivals",
    ctaHref: "/store",
  },
  newArrivalsHeading: "New arrivals",
  categoriesHeading: "Shop by category",
  featuredCategories: await Promise.all(
    categoryTiles.map(async ({ title, handle, file }) => ({
      _key: key(),
      title,
      handle,
      image: await uploadImage(sanity, file, title),
    }))
  ),
  featuredHeading: "Our favourites",
  story: {
    heading: "Australian owned, made with love",
    text: "Ritz & Ron began in 2020 in NSW with a simple idea: beautiful sterling silver that marks life's little milestones. Every piece is chosen by us and packed by hand.",
    image: await uploadImage(sanity, "brand-story.jpg", "Hands wearing silver rings and a bracelet"),
    ctaLabel: "Our story",
    ctaHref: "/about",
  },
  values: [
    "Free shipping over $99",
    "925 sterling silver, nickel-free",
    "30-day exchanges",
    "Gift ready",
  ],
  seo: {
    _type: "seo",
    title: "Ritz & Ron | Sterling Silver Jewellery & Charms",
    description:
      "Sterling silver charms, charm bracelets, earrings and necklaces. Australian owned, shipped from NSW with free shipping over $99.",
  },
})

export default async function seedSanityContent({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const sanity = getSanityClient()
  if (!sanity) {
    logger.error("SANITY_PROJECT_ID and SANITY_WRITE_TOKEN must be set")
    return
  }

  const docs: IdentifiedSanityDocumentStub[] = [
    ...pages.map(({ slug, title, body }) => ({
      _id: `page-${slug}`,
      _type: "page",
      title,
      body,
    })),
    ...faqs.map(({ slug, group, question, answer }, i) => ({
      _id: `faq-${slug}`,
      _type: "faq",
      question,
      group,
      order: (i + 1) * 10,
      answer: [p(answer)],
    })),
  ]

  const ids = [...docs.map((d) => d._id), "homePage"].flatMap((id) => [
    id,
    `drafts.${id}`,
  ])
  const existing = new Set(
    (await sanity.fetch<string[]>("*[_id in $ids]._id", { ids })).map((id) =>
      id.replace(/^drafts\./, "")
    )
  )

  // Built only when needed so the placeholder images upload once.
  if (!existing.has("homePage")) {
    docs.push(await buildHomePage(sanity))
  }

  const toCreate = docs.filter((d) => !existing.has(d._id))
  const tx = sanity.transaction()
  for (const doc of toCreate) {
    tx.createIfNotExists({ ...doc, _id: `drafts.${doc._id}` })
  }
  if (toCreate.length) {
    await tx.commit()
  }

  logger.info(
    `Created ${toCreate.length} Sanity drafts, skipped ${docs.length - toCreate.length} that already exist`
  )
}
