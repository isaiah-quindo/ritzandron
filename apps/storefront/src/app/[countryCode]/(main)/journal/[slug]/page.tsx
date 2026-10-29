import { urlFor } from "@cms/client"
import { getPost } from "@cms/queries"
import RichText from "@modules/common/components/rich-text"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

export const revalidate = 3600

type Props = { params: Promise<{ slug: string; countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const post = await getPost(slug)
  return {
    title: post?.title ?? "Journal",
    description: post?.excerpt,
  }
}

export default async function JournalPostPage(props: Props) {
  const { slug } = await props.params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="content-container py-16 small:py-24 max-w-3xl">
      <LocalizedClientLink
        href="/journal"
        className="text-[13px] underline underline-offset-4"
      >
        ← The Journal
      </LocalizedClientLink>
      <h1 className="text-3xl small:text-4xl tracking-[-0.04em] mt-6 mb-2">
        {post.title}
      </h1>
      {post.publishedAt && (
        <p className="text-[12px] text-stone mb-8">
          {new Date(post.publishedAt).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      {post.coverImage && (
        <div className="relative aspect-[16/10] mb-12 bg-mist overflow-hidden rounded-image">
          <Image
            src={urlFor(post.coverImage).width(1600).url()}
            alt={post.coverImage.alt ?? ""}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}
      <div className="text-base font-light leading-relaxed text-charcoal-soft">
        <RichText value={post.body} />
      </div>
    </article>
  )
}
