import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export default function ProductRow({
  title,
  products,
  region,
  viewAllHref = "/store",
}: {
  title: string
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  viewAllHref?: string
}) {
  if (!products.length) {
    return null
  }

  return (
    <section className="content-container pt-12 small:pt-16">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2 className="text-xl small:text-2xl tracking-[-0.04em]">{title}</h2>
        <LocalizedClientLink
          href={viewAllHref}
          className="text-[13px] underline underline-offset-4"
        >
          View all
        </LocalizedClientLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-2 gap-y-8">
        {products.slice(0, 8).map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}
