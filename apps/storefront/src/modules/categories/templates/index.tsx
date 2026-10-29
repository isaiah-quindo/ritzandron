import { notFound } from "next/navigation"
import { Suspense } from "react"

import { urlFor } from "@cms/client"
import { getCategoryEditorial } from "@cms/queries"
import Image from "next/image"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <>
      <CategoryBanner category={category} parents={parents} />
      <div
        className="flex flex-col small:flex-row small:items-start py-10 content-container"
        data-testid="category-container"
      >
        <RefinementList
          sortBy={sort}
          data-testid="sort-by-container"
          hideOptionsPicker
        />
        <div className="w-full">
          <Suspense
            fallback={
              <SkeletonProductGrid
                numberOfProducts={category.products?.length ?? 8}
              />
            }
          >
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              categoryId={category.id}
              countryCode={countryCode}
              optionValueIds={optionValueIds}
            />
          </Suspense>
        </div>
      </div>
    </>
  )
}

async function CategoryBanner({
  category,
  parents,
}: {
  category: HttpTypes.StoreProductCategory
  parents: HttpTypes.StoreProductCategory[]
}) {
  const editorial = await getCategoryEditorial(category.handle)
  const intro = editorial?.intro ?? category.description

  return (
    <section className="content-container pt-8 small:pt-10">
      {editorial?.image && (
        <div className="relative aspect-[21/9] mb-6 bg-mist overflow-hidden rounded-image">
          <Image
            src={urlFor(editorial.image).width(2000).url()}
            alt={editorial.image.alt ?? ""}
            fill
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="object-cover"
          />
        </div>
      )}
      <h1
        className="text-3xl small:text-4xl tracking-[-0.04em]"
        data-testid="category-page-title"
      >
        {editorial?.heading ?? category.name}
      </h1>
      {intro && (
        <p className="mt-2 text-sm text-charcoal-soft max-w-xl">{intro}</p>
      )}
      {!!(parents.length || category.category_children?.length) && (
        <ul className="flex flex-wrap gap-2 mt-5 text-[13px]">
          {parents.slice(0, 1).map((parent) => (
            <li key={parent.id}>
              <LocalizedClientLink
                href={`/categories/${parent.handle}`}
                className="inline-block rounded-[4px] bg-mist px-3 py-1.5 hover:bg-hairline transition-colors"
                data-testid="sort-by-link"
              >
                All {parent.name.toLowerCase()}
              </LocalizedClientLink>
            </li>
          ))}
          {category.category_children?.map((c) => (
            <li key={c.id}>
              <LocalizedClientLink
                href={`/categories/${c.handle}`}
                className="inline-block rounded-[4px] bg-mist px-3 py-1.5 hover:bg-hairline transition-colors"
              >
                {c.name}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
