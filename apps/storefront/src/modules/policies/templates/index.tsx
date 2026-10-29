import { convertToLocale } from "@lib/util/money"
import { formatDayRange, StorePolicies } from "@lib/util/store-policies"

export const formatShippingRate = (rate: number, currencyCode: string) =>
  rate === 0
    ? "Free"
    : convertToLocale({ amount: rate, currency_code: currencyCode })

export const PolicyPage = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div
    className="content-container pt-8 small:pt-10 pb-16 max-w-3xl"
    data-testid="policy-page"
  >
    <h1 className="text-3xl small:text-4xl tracking-[-0.04em] mb-8">{title}</h1>
    <div className="flex flex-col gap-6 text-[15px] leading-relaxed text-charcoal-soft">
      {children}
    </div>
  </div>
)

export const PoliciesUnavailable = () => (
  <p className="text-ui-fg-subtle">
    Policy details for this region haven&apos;t been published yet.
  </p>
)

export const ShippingSummary = ({
  policies,
  currencyCode,
}: {
  policies: StorePolicies
  currencyCode: string
}) => (
  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
    <dt className="text-ui-fg-subtle">Shipping rate</dt>
    <dd>{formatShippingRate(policies.shippingRate, currencyCode)}</dd>
    <dt className="text-ui-fg-subtle">Processing time</dt>
    <dd>{formatDayRange(policies.handlingDays)} business days</dd>
    <dt className="text-ui-fg-subtle">Delivery time</dt>
    <dd>{formatDayRange(policies.transitDays)} business days after dispatch</dd>
  </dl>
)

export const ReturnsSummary = ({ policies }: { policies: StorePolicies }) => (
  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
    <dt className="text-ui-fg-subtle">Exchange window</dt>
    <dd>{policies.returnWindowDays} days from dispatch</dd>
    <dt className="text-ui-fg-subtle">Return postage</dt>
    <dd>{policies.freeReturns ? "Free" : "Paid by the customer"}</dd>
  </dl>
)
