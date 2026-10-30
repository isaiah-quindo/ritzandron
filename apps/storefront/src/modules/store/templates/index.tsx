"use client"

import type { SearchClient } from "instantsearch.js"
import { Configure, InstantSearch } from "react-instantsearch"

import { PRODUCT_INDEX_NAME, searchClient } from "@lib/search-client"
import StoreHits from "@modules/store/components/store-hits"
import StoreRefinements, {
  MobileStoreRefinements,
} from "@modules/store/components/store-refinements"
import StoreSearchBox from "@modules/store/components/store-search-box"

const PRODUCT_LIMIT = 12

const StoreTemplate = ({ currencyCode }: { currencyCode: string }) => {
  return (
    <div
      className="pt-8 small:pt-10 pb-10 content-container"
      data-testid="category-container"
    >
      <InstantSearch
        indexName={PRODUCT_INDEX_NAME}
        searchClient={searchClient as unknown as SearchClient}
        routing
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={PRODUCT_LIMIT} />
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1
            className="text-3xl small:text-4xl tracking-[-0.04em]"
            data-testid="store-page-title"
          >
            Shop all
          </h1>
          <MobileStoreRefinements currencyCode={currencyCode} />
        </div>

        <div className="flex flex-col small:flex-row small:items-start">
          <StoreRefinements currencyCode={currencyCode} />
          <div className="w-full min-w-0">
            <StoreSearchBox />
            <StoreHits
              hitsPerPage={PRODUCT_LIMIT}
              currencyCode={currencyCode}
            />
          </div>
        </div>
      </InstantSearch>
    </div>
  )
}

export default StoreTemplate
