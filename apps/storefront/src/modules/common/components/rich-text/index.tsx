import { urlFor } from "@cms/client"
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextBlock,
} from "@portabletext/react"
import Image from "next/image"

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-light mt-10 mb-4">{children}</h2>
    ),
    h3: ({ children }) => <h3 className="text-2xl mt-8 mb-3">{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="text-2xl border-l border-accent pl-6 my-8">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="underline underline-offset-4 decoration-accent"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) =>
      value?.asset ? (
        <span className="block relative aspect-[4/3] my-8 overflow-hidden rounded-image">
          <Image
            src={urlFor(value).width(1400).url()}
            alt={value.alt ?? ""}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
        </span>
      ) : null,
  },
}

export default function RichText({ value }: { value?: PortableTextBlock[] }) {
  if (!value?.length) {
    return null
  }
  return <PortableText value={value} components={components} />
}
