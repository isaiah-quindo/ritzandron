import { clx } from "@modules/common/components/ui"

/**
 * The Ritz & Ron logotype: condensed serif capitals with an italic ampersand.
 * Set in live type (Instrument Serif via `font-logo`) so it stays crisp at any size.
 */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={clx(
        "font-logo font-normal uppercase leading-none tracking-[-0.01em] whitespace-nowrap",
        className
      )}
      aria-label="Ritz & Ron"
    >
      Ritz <span className="normal-case italic">&amp;</span> Ron
    </span>
  )
}
