import fs from "fs"
import path from "path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductTagsWorkflow,
  createProductsWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * One-off import of the WooCommerce catalogue from ritzandron.com.au.
 *
 *   npx medusa exec ./src/scripts/import-woocommerce.ts                  # dry run
 *   npx medusa exec ./src/scripts/import-woocommerce.ts commit           # import
 *   npx medusa exec ./src/scripts/import-woocommerce.ts commit include-drafts
 *
 * (The Medusa CLI rejects unknown --flags, so options are plain words.)
 *
 * Needs WC_URL, WC_CONSUMER_KEY and WC_CONSUMER_SECRET (read-only key).
 * Products whose handle already exists are skipped, so re-running is safe.
 * A report is written to .import/woocommerce-report.md either way.
 */

type WooImage = { src: string; alt?: string }
type WooCategory = { id: number; slug: string; name: string; parent: number }
type WooAttribute = { name: string; options: string[]; variation: boolean }
type WooVariation = {
  id: number
  sku: string
  regular_price: string
  sale_price: string
  manage_stock: boolean | "parent"
  stock_quantity: number | null
  stock_status: string
  attributes: { name: string; option: string }[]
}
type WooProduct = {
  id: number
  name: string
  slug: string
  type: string
  status: string
  description: string
  short_description: string
  sku: string
  regular_price: string
  sale_price: string
  manage_stock: boolean
  stock_quantity: number | null
  stock_status: string
  categories: { id: number; slug: string; name: string }[]
  images: WooImage[]
  attributes: WooAttribute[]
}

// WooCommerce category slug -> existing Medusa category handle (from the seed).
const CATEGORY_MAP: Record<string, string> = {
  charms: "silver-charms",
  animals: "charms-animals",
  "birth-stones": "charms-birthstones",
  heart: "charms-hearts-and-love",
  love: "charms-hearts-and-love",
  "moon-and-stars": "charms-moon-and-stars",
  family: "charms-family",
  mum: "charms-family",
  "sea-life": "charms-sea-life",
  "rose-gold": "charms-rose-gold",
  "zodiac-sign": "charms-zodiac",
  pendant: "charms-dangles",
  crystals: "charms-crystals",
  bracelet: "charm-bracelets",
  "charm-bracelets": "charm-bracelets",
  earrings: "earrings",
  necklace: "necklaces",
  "necklace-2": "necklaces",
  "featured-pendants": "necklaces",
  "jewellery-set": "jewellery-sets",
  giftbox: "gift-boxes",
  "gift-box": "gift-boxes",
  "animal-scrunchie": "scrunchies",
  "anime-scrunchie": "scrunchies",
  "anime-scrunchies": "scrunchies",
  "floral-scrunchies": "scrunchies",
  "rainbow-scrunchies": "scrunchies",
  "regular-scrunchie": "scrunchies",
  "xl-scrunchies": "scrunchies",
}

// Charm themes the seed doesn't have; created under Silver Charms as needed.
const NEW_CHARM_THEMES = new Set([
  "angel", "beads", "blue-charms", "clips", "disney", "dream-catcher", "flower",
  "harry-potter", "infinity", "inspiration-charms", "letters", "skulls",
  "spacer", "spacers", "sparkle", "spiritual",
])
const NEW_EARRING_STYLES = new Set(["hoop-earrings", "pearl", "stud"])

// Merchandising groupings become product tags rather than categories.
const TAG_MAP: Record<string, string> = {
  "featured-charms": "Featured",
  "featured-pendants": "Featured",
  "pink-collections": "Pink collection",
  "silver-swarovski": "Swarovski",
}
// Groupings with no meaning in the new store.
const IGNORED = new Set(["jewellery", "new-arrivals", "inspiration", "uncategorized"])

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–",
  mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
}

export const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)

/** WooCommerce HTML to the plain text the storefront renders (pre-line). */
export const htmlToText = (html: string) =>
  decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/(p|li|h[1-6]|div|ul|ol)>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

const toHandle = (slug: string) =>
  decodeURIComponent(slug)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "")

const price = (s: string) => (s ? Math.round(Number(s) * 100) / 100 : null)

const loadEnv = () => {
  const { WC_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env
  if (!WC_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    throw new Error("Set WC_URL, WC_CONSUMER_KEY and WC_CONSUMER_SECRET in .env")
  }
  return {
    base: `${WC_URL.replace(/\/$/, "")}/wp-json/wc/v3`,
    auth: "Basic " + Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64"),
  }
}

async function wooGetAll<T>(env: ReturnType<typeof loadEnv>, resource: string): Promise<T[]> {
  const all: T[] = []
  for (let page = 1; ; page++) {
    const sep = resource.includes("?") ? "&" : "?"
    const res = await fetch(`${env.base}/${resource}${sep}per_page=100&page=${page}`, {
      headers: { authorization: env.auth },
    })
    if (!res.ok) {
      throw new Error(`WooCommerce ${resource} returned ${res.status}`)
    }
    all.push(...((await res.json()) as T[]))
    if (page >= Number(res.headers.get("x-wp-totalpages") ?? 1)) {
      return all
    }
  }
}

type PlannedVariant = {
  title: string
  sku?: string
  options: Record<string, string>
  price: number
  salePrice: number | null
  manageInventory: boolean
  stock: number
}

type PlannedProduct = {
  wooId: number
  title: string
  handle: string
  description: string
  categoryHandles: string[]
  tags: string[]
  images: WooImage[]
  options: { title: string; values: string[] }[]
  variants: PlannedVariant[]
  warnings: string[]
}

const stockFor = (manage: boolean, qty: number | null, status: string) => ({
  // Untracked but out of stock: track it at 0 so it can't be bought.
  manageInventory: manage || status === "outofstock",
  stock: manage ? Math.max(qty ?? 0, 0) : 0,
})

export default async function importWooCommerce({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const commit = args?.includes("commit") ?? false
  const includeDrafts = args?.includes("include-drafts") ?? false
  const env = loadEnv()

  logger.info(`WooCommerce import (${commit ? "COMMIT" : "dry run"})`)

  const [wooProducts, wooCategories] = await Promise.all([
    wooGetAll<WooProduct>(env, `products?status=${includeDrafts ? "any" : "publish"}`),
    wooGetAll<WooCategory>(env, "products/categories"),
  ])
  const wooCategoryById = new Map(wooCategories.map((c) => [c.id, c]))

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
  })
  const existingHandles = new Set(existingProducts.map((p) => p.handle))

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  })
  const categoryIdByHandle = new Map(existingCategories.map((c) => [c.handle, c.id]))

  // Definitions for categories the seed lacks; only those used by an imported
  // product are created.
  const categoryDefs = new Map<string, { name: string; parentHandle?: string }>()
  const unmappedCategories = new Map<string, number>()
  const seenSkus = new Set<string>()
  const planned: PlannedProduct[] = []
  const skipped: { title: string; reason: string }[] = []

  for (const p of wooProducts) {
    const title = decodeEntities(p.name).trim()
    const handle = toHandle(p.slug)
    if (!handle) {
      skipped.push({ title, reason: "no URL slug" })
      continue
    }
    if (existingHandles.has(handle)) {
      skipped.push({ title, reason: "already imported" })
      continue
    }
    if (p.type !== "simple" && p.type !== "variable") {
      skipped.push({ title, reason: `unsupported product type "${p.type}"` })
      continue
    }

    const warnings: string[] = []
    const categoryHandles = new Set<string>()
    const tags = new Set<string>()

    for (const c of p.categories) {
      if (CATEGORY_MAP[c.slug]) {
        categoryHandles.add(CATEGORY_MAP[c.slug])
      } else if (NEW_CHARM_THEMES.has(c.slug) || NEW_EARRING_STYLES.has(c.slug)) {
        const isCharm = NEW_CHARM_THEMES.has(c.slug)
        const h = isCharm
          ? `charms-${c.slug.replace(/-charms$/, "").replace(/s$/, "")}`
          : `earrings-${c.slug.replace(/-earrings$/, "")}`
        categoryDefs.set(h, {
          name: decodeEntities(wooCategoryById.get(c.id)?.name ?? c.name),
          parentHandle: isCharm ? "silver-charms" : "earrings",
        })
        categoryHandles.add(h)
        categoryHandles.add(isCharm ? "silver-charms" : "earrings")
      } else if (TAG_MAP[c.slug]) {
        tags.add(TAG_MAP[c.slug])
      } else if (!IGNORED.has(c.slug)) {
        unmappedCategories.set(c.slug, (unmappedCategories.get(c.slug) ?? 0) + 1)
      }
    }

    if (/candle/i.test(title)) {
      categoryDefs.set("candles", { name: "Candles" })
      categoryHandles.add("candles")
    }
    if (!categoryHandles.size && /scrunch/i.test(title)) {
      categoryHandles.add("scrunchies")
    }
    if (!categoryHandles.size) {
      warnings.push("no category (will be uncategorised)")
    }

    const description = htmlToText(p.description || p.short_description || "")
    if (/https?:\/\/(?!(www\.)?ritzandron\.com\.au)/i.test(p.description)) {
      warnings.push("description had external links (removed with the HTML)")
    }
    if (!p.images.length) {
      warnings.push("no images")
    }
    if (/personalis/i.test(title)) {
      warnings.push("personalised item: customer text input isn't supported yet")
    }

    const takeSku = (sku: string) => {
      if (!sku) {
        return undefined
      }
      if (seenSkus.has(sku)) {
        warnings.push(`duplicate SKU "${sku}" dropped`)
        return undefined
      }
      seenSkus.add(sku)
      return sku
    }

    let options: PlannedProduct["options"]
    let variants: PlannedVariant[]

    if (p.type === "simple") {
      const regular = price(p.regular_price)
      if (regular === null) {
        skipped.push({ title, reason: "no price" })
        continue
      }
      options = [{ title: "Default", values: ["Default"] }]
      variants = [
        {
          title: "Default",
          sku: takeSku(p.sku),
          options: { Default: "Default" },
          price: regular,
          salePrice: price(p.sale_price),
          ...stockFor(p.manage_stock, p.stock_quantity, p.stock_status),
        },
      ]
    } else {
      const variationAttrs = p.attributes.filter((a) => a.variation)
      const wooVariations = await wooGetAll<WooVariation>(env, `products/${p.id}/variations`)
      options = variationAttrs.map((a) => ({
        title: decodeEntities(a.name).replace(/_\d+$/, ""),
        values: a.options.map((o) => decodeEntities(o)),
      }))
      variants = []
      const seenCombos = new Set<string>()
      for (const v of wooVariations) {
        const regular = price(v.regular_price)
        if (regular === null) {
          warnings.push(`variation ${v.id} skipped (no price)`)
          continue
        }
        // WooCommerce "Any <attribute>" variations cover every value of that
        // attribute; expand them into one Medusa variant per combination.
        let combos: Record<string, string>[] = [{}]
        let expanded = false
        for (const [i, a] of variationAttrs.entries()) {
          const chosen = v.attributes.find((x) => x.name === a.name)?.option
          const values = chosen ? [decodeEntities(chosen)] : options[i].values
          expanded ||= !chosen
          combos = combos.flatMap((c) => values.map((val) => ({ ...c, [options[i].title]: val })))
        }
        const manage = v.manage_stock === "parent" ? p.manage_stock : v.manage_stock
        const qty = v.manage_stock === "parent" ? p.stock_quantity : v.stock_quantity
        // Stock shared by an "any" variation can't be split per variant.
        const stock = expanded
          ? { manageInventory: v.stock_status === "outofstock", stock: 0 }
          : stockFor(Boolean(manage), qty, v.stock_status)
        if (expanded && manage) {
          warnings.push("shared stock across options isn't tracked; set stock per option in the admin")
        }
        for (const opts of combos) {
          const key = JSON.stringify(opts)
          if (seenCombos.has(key)) {
            continue
          }
          seenCombos.add(key)
          variants.push({
            title: Object.values(opts).join(" / "),
            sku: expanded ? undefined : takeSku(v.sku),
            options: opts,
            price: regular,
            salePrice: price(v.sale_price),
            ...stock,
          })
        }
      }
      if (!variants.length) {
        skipped.push({ title, reason: "variable product with no usable variations" })
        continue
      }
    }

    planned.push({
      wooId: p.id,
      title,
      handle,
      description,
      categoryHandles: [...categoryHandles],
      tags: [...tags],
      images: p.images.slice(0, 8),
      options,
      variants,
      warnings,
    })
  }

  const usedHandles = new Set(planned.flatMap((p) => p.categoryHandles))
  const newCategories = new Map(
    [...categoryDefs].filter(([h]) => usedHandles.has(h) && !categoryIdByHandle.has(h))
  )

  const report = buildReport({
    commit,
    totalFetched: wooProducts.length,
    planned,
    skipped,
    newCategories,
    unmappedCategories,
  })
  const reportDir = path.join(process.cwd(), ".import")
  fs.mkdirSync(reportDir, { recursive: true })
  fs.writeFileSync(path.join(reportDir, "woocommerce-report.md"), report)
  logger.info(`Report written to .import/woocommerce-report.md`)
  logger.info(
    `${planned.length} to import, ${skipped.length} skipped, ${newCategories.size} new categories`
  )

  if (!commit) {
    logger.info('Dry run only. Re-run with "commit" to import.')
    return
  }

  // Categories (parents first; all parents already exist from the seed).
  const toCreate = [...newCategories].filter(([h]) => !categoryIdByHandle.has(h))
  if (toCreate.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: toCreate.map(([handle, c]) => ({
          name: c.name,
          handle,
          is_active: true,
          parent_category_id: c.parentHandle ? categoryIdByHandle.get(c.parentHandle) : undefined,
        })),
      },
    })
    result.forEach((c) => categoryIdByHandle.set(c.handle, c.id))
  }

  // Tags.
  const { data: existingTags } = await query.graph({ entity: "product_tag", fields: ["id", "value"] })
  const tagIdByValue = new Map(existingTags.map((t) => [t.value, t.id]))
  const missingTags = [...new Set(planned.flatMap((p) => p.tags))].filter((t) => !tagIdByValue.has(t))
  if (missingTags.length) {
    const { result } = await createProductTagsWorkflow(container).run({
      input: { product_tags: missingTags.map((value) => ({ value })) },
    })
    result.forEach((t) => tagIdByValue.set(t.value, t.id))
  }

  const [{ data: salesChannels }, { data: shippingProfiles }, { data: stockLocations }] =
    await Promise.all([
      query.graph({ entity: "sales_channel", fields: ["id"] }),
      query.graph({ entity: "shipping_profile", fields: ["id"] }),
      query.graph({ entity: "stock_location", fields: ["id"] }),
    ])

  const salePrices: { variant_id: string; amount: number; currency_code: string }[] = []
  let done = 0

  for (const p of planned) {
    try {
      const imageUrls = await uploadImages(container, p)

      const { result } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: p.title,
              handle: p.handle,
              description: p.description,
              status: ProductStatus.PUBLISHED,
              thumbnail: imageUrls[0],
              images: imageUrls.map((url) => ({ url })),
              category_ids: p.categoryHandles
                .map((h) => categoryIdByHandle.get(h))
                .filter((id): id is string => Boolean(id)),
              tag_ids: p.tags.map((t) => tagIdByValue.get(t)!).filter(Boolean),
              shipping_profile_id: shippingProfiles[0].id,
              sales_channels: [{ id: salesChannels[0].id }],
              metadata: { woocommerce_id: p.wooId },
              options: p.options,
              variants: p.variants.map((v) => ({
                title: v.title,
                sku: v.sku,
                options: v.options,
                manage_inventory: v.manageInventory,
                prices: [{ currency_code: "aud", amount: v.price }],
              })),
            },
          ],
        },
      })

      const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["id", "title", "inventory_items.inventory_item_id"],
        filters: { product_id: result[0].id },
      })

      const levels: {
        location_id: string
        inventory_item_id: string
        stocked_quantity: number
      }[] = []
      for (const v of variants) {
        const plan = p.variants.find((pv) => pv.title === v.title)
        const inventoryItemId = v.inventory_items?.[0]?.inventory_item_id
        if (plan?.manageInventory && inventoryItemId) {
          levels.push({
            location_id: stockLocations[0].id,
            inventory_item_id: inventoryItemId,
            stocked_quantity: plan.stock,
          })
        }
        if (plan?.salePrice && plan.salePrice < plan.price) {
          salePrices.push({ variant_id: v.id, amount: plan.salePrice, currency_code: "aud" })
        }
      }
      if (levels.length) {
        await createInventoryLevelsWorkflow(container).run({
          input: { inventory_levels: levels },
        })
      }

      done++
      logger.info(`[${done}/${planned.length}] ${p.title}`)
    } catch (e) {
      logger.error(`Failed to import "${p.title}": ${(e as Error).message}`)
    }
  }

  if (salePrices.length) {
    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: "Imported WooCommerce sale prices",
            description: "Sale prices carried over from the old site",
            status: "active" as never,
            prices: salePrices,
          },
        ],
      },
    })
  }

  logger.info(`Imported ${done} of ${planned.length} products.`)
}

async function uploadImages(container: ExecArgs["container"], p: PlannedProduct) {
  const urls: string[] = []
  for (const [i, image] of p.images.entries()) {
    const res = await fetch(image.src)
    if (!res.ok) {
      continue
    }
    const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg"
    if (!mimeType.startsWith("image/")) {
      continue
    }
    const ext = mimeType.split("/")[1].replace("jpeg", "jpg")
    const { result } = await uploadFilesWorkflow(container).run({
      input: {
        files: [
          {
            filename: `${p.handle}-${i + 1}.${ext}`,
            mimeType,
            content: Buffer.from(await res.arrayBuffer()).toString("base64"),
            access: "public",
          },
        ],
      },
    })
    urls.push(result[0].url)
  }
  return urls
}

function buildReport(r: {
  commit: boolean
  totalFetched: number
  planned: PlannedProduct[]
  skipped: { title: string; reason: string }[]
  newCategories: Map<string, { name: string; parentHandle?: string }>
  unmappedCategories: Map<string, number>
}) {
  const byCategory = new Map<string, number>()
  r.planned.forEach((p) =>
    (p.categoryHandles.length ? p.categoryHandles : ["(none)"]).forEach((h) =>
      byCategory.set(h, (byCategory.get(h) ?? 0) + 1)
    )
  )
  const variants = r.planned.flatMap((p) => p.variants)
  const lines = [
    `# WooCommerce import report (${r.commit ? "commit" : "dry run"})`,
    "",
    `Generated ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Fetched from WooCommerce: ${r.totalFetched}`,
    `- To import: ${r.planned.length} products, ${variants.length} variants`,
    `- Images to copy: ${r.planned.reduce((n, p) => n + p.images.length, 0)}`,
    `- Out of stock (imported at 0): ${variants.filter((v) => v.manageInventory && v.stock === 0).length} variants`,
    `- On sale: ${variants.filter((v) => v.salePrice && v.salePrice < v.price).length} variants`,
    `- Skipped: ${r.skipped.length}`,
    "",
    "## Products per category",
    "",
    ...[...byCategory].sort((a, b) => b[1] - a[1]).map(([h, n]) => `- ${h}: ${n}`),
    "",
    "## New categories to create",
    "",
    ...(r.newCategories.size
      ? [...r.newCategories].map(([h, c]) => `- ${c.name} (\`${h}\`)${c.parentHandle ? ` under ${c.parentHandle}` : ""}`)
      : ["- none"]),
    "",
    "## Unmapped WooCommerce categories",
    "",
    ...(r.unmappedCategories.size
      ? [...r.unmappedCategories].map(([s, n]) => `- ${s} (${n} products)`)
      : ["- none"]),
    "",
    "## Warnings",
    "",
    ...(r.planned.some((p) => p.warnings.length)
      ? r.planned.filter((p) => p.warnings.length).map((p) => `- **${p.title}**: ${p.warnings.join("; ")}`)
      : ["- none"]),
    "",
    "## Skipped",
    "",
    ...(r.skipped.length ? r.skipped.map((s) => `- ${s.title}: ${s.reason}`) : ["- none"]),
    "",
    "## All products",
    "",
    "| Product | Handle | Price (AUD) | Variants | Stock | Images | Categories | Tags |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...r.planned.map((p) => {
      const prices = p.variants.map((v) => v.price)
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      const stock = p.variants.map((v) => (v.manageInventory ? v.stock : "∞")).join("/")
      return `| ${p.title.replace(/\|/g, "/")} | ${p.handle} | ${min === max ? min : `${min}–${max}`} | ${p.variants.length} | ${stock} | ${p.images.length} | ${p.categoryHandles.join(", ")} | ${p.tags.join(", ")} |`
    }),
    "",
  ]
  return lines.join("\n")
}
