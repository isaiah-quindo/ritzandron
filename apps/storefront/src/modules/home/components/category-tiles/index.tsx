import { urlFor } from "@cms/client"
import type { HomePage } from "@cms/queries"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

/** Hidden until featured categories are added in Sanity. */
export default function CategoryTiles({
  heading,
  categories,
}: {
  heading?: string
  categories?: HomePage["featuredCategories"]
}) {
  const tiles = categories?.filter((tile) => tile.handle) ?? []
  if (!tiles.length) {
    return null
  }

  return (
    <section className="content-container pt-12 small:pt-16">
      <h2 className="text-xl small:text-2xl tracking-[-0.04em] mb-5">
        {heading || "Shop by category"}
      </h2>
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-2">
        {tiles.map((tile) => (
          <li key={tile.handle}>
            <LocalizedClientLink
              href={`/categories/${tile.handle}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-image isolate bg-mist"
            >
              {tile.image && (
                <>
                  <Image
                    src={urlFor(tile.image).width(800).url()}
                    alt={tile.image.alt ?? tile.title ?? ""}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                </>
              )}
              <span
                className={
                  tile.image
                    ? "absolute left-4 bottom-4 text-paper text-base font-medium"
                    : "absolute left-4 bottom-4 text-charcoal text-base font-medium"
                }
              >
                {tile.title}
              </span>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
