/** Hidden until the value strip has items in Sanity. */
export default function ValueProps({ values }: { values?: string[] }) {
  const items = values?.filter(Boolean) ?? []
  if (!items.length) {
    return null
  }

  return (
    <section className="content-container pt-12 small:pt-16">
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-y-3 border-y border-hairline py-5 text-[13px] text-charcoal-soft">
        {items.map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ul>
    </section>
  )
}
