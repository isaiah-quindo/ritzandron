import { urlFor } from "@cms/client"
import { getPosts } from "@cms/queries"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Metadata } from "next"
import Image from "next/image"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Journal",
  description: "Gifting guides, styling notes and silver care from Ritz & Ron.",
}

export default async function JournalPage() {
  const posts = (await getPosts()) ?? []

  return (
    <div className="content-container pt-8 small:pt-10 pb-16">
      <h1 className="text-3xl small:text-4xl tracking-[-0.04em] mb-6">
        Journal
      </h1>
      {posts.length ? (
        <ul className="grid grid-cols-1 small:grid-cols-3 gap-x-2 gap-y-8">
          {posts.map((post) => (
            <li key={post._id}>
              <LocalizedClientLink
                href={`/journal/${post.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] bg-mist overflow-hidden rounded-image isolate">
                  {post.coverImage && (
                    <Image
                      src={urlFor(post.coverImage).width(900).url()}
                      alt={post.coverImage.alt ?? ""}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                {post.publishedAt && (
                  <p className="text-[12px] text-stone mt-3">
                    {new Date(post.publishedAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
                <h2 className="text-2xl mt-2 text-charcoal">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-sm text-stone mt-2 line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-stone">New stories are on their way.</p>
      )}
    </div>
  )
}
