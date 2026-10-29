import { getFaqs } from "@cms/queries"
import RichText from "@modules/common/components/rich-text"
import { PolicyPage } from "@modules/policies/templates"
import { Metadata } from "next"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "FAQ",
  description: "Orders, shipping, exchanges and jewellery care at Ritz & Ron.",
}

export default async function FaqPage() {
  const faqs = await getFaqs()

  return (
    <PolicyPage title="Frequently asked">
      {faqs?.length ? (
        <div className="divide-y divide-hairline border-y border-hairline">
          {faqs.map((f) => (
            <details key={f._id} className="group py-5">
              <summary className="flex justify-between cursor-pointer list-none text-base text-charcoal">
                {f.question}
                <span className="text-stone transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="pt-4">
                <RichText value={f.answer} />
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="text-ui-fg-subtle" data-testid="page-coming-soon">
          This page is coming soon.
        </p>
      )}
    </PolicyPage>
  )
}
