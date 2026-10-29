import React, { Suspense } from "react"

import { getProductStory } from "@cms/queries"
import RichText from "@modules/common/components/rich-text"
import VariantImageGallery from "@modules/products/components/image-gallery/variant-image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate = async ({
  product,
  region,
  countryCode,
}: ProductTemplateProps) => {
  if (!product || !product.id) {
    return notFound()
  }

  const story = await getProductStory(product.id)

  return (
    <>
      <div
        className="content-container grid grid-cols-1 small:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-8 small:gap-16 py-6 small:py-12 relative"
        data-testid="product-container"
      >
        <div className="block w-full relative">
          <VariantImageGallery product={product} />
        </div>
        <div className="flex flex-col small:sticky small:top-36 self-start w-full gap-y-8 small:max-w-[460px]">
          <ProductInfo product={product} />
          <ProductActions product={product} region={region} />
          <ProductTabs
            product={product}
            story={
              story?.story?.length ? <RichText value={story.story} /> : null
            }
            materials={story?.materials}
            careNotes={story?.careNotes}
          />
        </div>
      </div>
      <div
        className="content-container my-16 small:my-28"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
