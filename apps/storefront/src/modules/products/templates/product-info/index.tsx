import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4">
        <Heading
          level="h1"
          className="text-2xl small:text-3xl tracking-[-0.04em] leading-tight"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <Text
          className="text-sm text-charcoal-soft leading-relaxed whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
