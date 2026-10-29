import { urlFor } from "@cms/client"
import type { HomePage } from "@cms/queries"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

/** Hidden until the story block has a heading in Sanity. */
export default function BrandStory({ story }: { story?: HomePage["story"] }) {
  if (!story?.heading) {
    return null
  }
  const { heading, text, image, ctaLabel, ctaHref } = story

  return (
    <section className="content-container pt-12 small:pt-16">
      <div className={`grid gap-2 ${image ? "small:grid-cols-2" : ""}`}>
        {image && (
          <div className="relative aspect-[4/5] small:aspect-auto small:min-h-[480px] bg-mist overflow-hidden rounded-image">
            <Image
              src={urlFor(image).width(1200).url()}
              alt={image.alt ?? ""}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="flex flex-col justify-end items-start gap-4 p-5 small:p-10 bg-mist rounded-image">
          <h2 className="text-2xl small:text-4xl tracking-[-0.04em] leading-tight max-w-md">
            {heading}
          </h2>
          {text && (
            <p className="text-sm small:text-base text-charcoal-soft max-w-md">
              {text}
            </p>
          )}
          {ctaLabel && ctaHref && (
            <LocalizedClientLink
              href={ctaHref}
              className="text-[13px] font-medium underline underline-offset-4"
            >
              {ctaLabel}
            </LocalizedClientLink>
          )}
        </div>
      </div>
    </section>
  )
}
