"use client"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { ReactNode } from "react"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  /** Rendered Sanity portable text. */
  story?: ReactNode
  materials?: string[]
  careNotes?: string
}

const DEFAULT_CARE =
  "Store each piece in its pouch away from air and moisture to slow tarnishing. Remove before swimming, showering or applying perfume and lotions. Polish gently with a soft silver cloth."

// Categories whose products aren't silver, so silver care/material copy is wrong.
const NON_JEWELLERY_CATEGORIES = new Set(["scrunchies", "candles"])

const ProductTabs = ({
  product,
  story,
  materials,
  careNotes,
}: ProductTabsProps) => {
  const isJewellery = !product.categories?.some((c) =>
    NON_JEWELLERY_CATEGORIES.has(c.handle)
  )
  const details = (
    <DetailsTab
      product={product}
      materials={materials}
      isJewellery={isJewellery}
    />
  )

  const tabs = [
    story && {
      label: "The story",
      component: <div className="text-sm text-charcoal-soft py-6">{story}</div>,
    },
    (isJewellery || materials?.length || product.material) && {
      label: "Details & materials",
      component: details,
    },
    (isJewellery || careNotes) && {
      label: isJewellery ? "Caring for your silver" : "Care",
      component: (
        <p className="text-sm text-charcoal-soft leading-relaxed py-6">
          {careNotes || DEFAULT_CARE}
        </p>
      ),
    },
    {
      label: "Shipping & exchanges",
      component: <ShippingInfoTab />,
    },
  ].filter(Boolean) as { label: string; component: ReactNode }[]

  return (
    <div className="w-full border-t border-hairline">
      <Accordion type="multiple" defaultValue={[tabs[0].label]}>
        {tabs.map((tab) => (
          <Accordion.Item
            key={tab.label}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const DetailsTab = ({
  product,
  materials,
  isJewellery,
}: {
  product: HttpTypes.StoreProduct
  materials?: string[]
  isJewellery: boolean
}) => {
  const rows = [
    ["Material", materials?.length ? materials.join(", ") : product.material],
    ["Weight", product.weight ? `${product.weight} g` : null],
    [
      "Dimensions",
      product.length && product.width && product.height
        ? `${product.length} × ${product.width} × ${product.height} mm`
        : null,
    ],
    ["Origin", product.origin_country],
  ].filter(([, value]) => value)

  return (
    <dl className="text-sm py-6 grid grid-cols-[120px_1fr] gap-y-3">
      {rows.length
        ? rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-stone">{label}</dt>
              <dd className="text-charcoal">{value}</dd>
            </div>
          ))
        : isJewellery && (
            <p className="col-span-2 text-charcoal-soft">
              925 sterling silver. Nickel-free and hypoallergenic.
            </p>
          )}
    </dl>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-sm text-charcoal-soft leading-relaxed py-6 flex flex-col gap-4">
      <p>
        <span className="text-charcoal">Australia Post, tracked.</span> Orders
        are packed by hand in NSW and dispatched within 1–2 business days.
        Parcel Post arrives in 2–7 business days; Express Post in 1–3. Free
        Parcel Post on orders over $99.
      </p>
      <p>
        <span className="text-charcoal">30-day exchanges.</span> Unworn pieces
        in their original packaging can be exchanged within 30 days. For hygiene
        reasons, earrings for pierced ears can&apos;t be exchanged.{" "}
        <LocalizedClientLink
          href="/returns"
          className="underline underline-offset-4"
        >
          Read the full policy
        </LocalizedClientLink>
        .
      </p>
    </div>
  )
}

export default ProductTabs
