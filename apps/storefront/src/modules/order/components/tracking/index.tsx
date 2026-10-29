import type { OrderTracking as OrderTrackingInfo } from "@lib/data/orders"

export default function OrderTracking({
  tracking,
}: {
  tracking: OrderTrackingInfo[]
}) {
  if (!tracking.length) {
    return null
  }

  return (
    <div
      className="border border-hairline bg-paper p-6"
      data-testid="order-tracking"
    >
      <h2 className="text-[13px] font-medium mb-2">Australia Post tracking</h2>
      <ul className="flex flex-col gap-2">
        {tracking.map((t) => (
          <li
            key={t.tracking_number}
            className="flex flex-wrap items-center gap-4"
          >
            <span className="text-xl text-charcoal">{t.tracking_number}</span>
            <a
              href={t.tracking_url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] underline underline-offset-4"
            >
              Track parcel
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
