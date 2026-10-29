import { urlFor } from "@cms/client"
import type { HomePage } from "@cms/queries"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

/** Hidden until the hero has a heading in Sanity. */
export default function Hero({ hero }: { hero?: HomePage["hero"] }) {
  if (!hero?.heading) {
    return null
  }
  const { heading, text, image, ctaLabel, ctaHref } = hero

  return (
    <section className="content-container pt-2">
      <LocalizedClientLink
        href={ctaHref || "/store"}
        className="group relative block overflow-hidden rounded-image isolate bg-mist aspect-[4/5] small:aspect-[21/9]"
      >
        {image && (
          <>
            <Image
              src={urlFor(image).width(2000).url()}
              alt={image.alt ?? ""}
              fill
              priority
              sizes="(max-width: 1440px) 100vw, 1440px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          </>
        )}
        <div
          className={`absolute inset-x-0 bottom-0 p-5 small:p-8 flex flex-col items-start gap-2 max-w-xl ${
            image ? "text-paper" : "text-charcoal"
          }`}
        >
          <h1 className="text-3xl small:text-5xl tracking-[-0.04em] leading-[1.05]">
            {heading}
          </h1>
          {text && <p className="text-sm small:text-base opacity-90">{text}</p>}
          {ctaLabel && (
            <span className="mt-2 text-[13px] font-medium underline underline-offset-4">
              {ctaLabel}
            </span>
          )}
        </div>
      </LocalizedClientLink>
    </section>
  )
}
