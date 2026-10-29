import { useFormValue, type FieldProps } from "sanity"
import { pageDocumentId } from "../pages"

const livePolicyPages = new Set([
  pageDocumentId("shipping"),
  pageDocumentId("returns"),
])

/** Adds the Medusa note to the body field on Shipping and Returns only. */
export function PageBodyField(props: FieldProps) {
  const id = String(useFormValue(["_id"]) ?? "").replace(/^drafts\./, "")

  return props.renderDefault(
    livePolicyPages.has(id)
      ? {
          ...props,
          description:
            "The live rates and return window from Medusa are shown below this text, so there's no need to repeat those numbers here.",
        }
      : props
  )
}
