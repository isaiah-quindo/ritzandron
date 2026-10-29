import { revalidateTag } from "next/cache"
import { parseBody } from "next-sanity/webhook"
import { NextRequest, NextResponse } from "next/server"

/**
 * Two callers:
 * - Sanity webhook (signed with SANITY_WEBHOOK_SECRET), body `{ _type }`
 * - Medusa backend product subscriber, header `x-revalidate-secret`, body `{ tags }`
 */
export async function POST(req: NextRequest) {
  const medusaSecret = req.headers.get("x-revalidate-secret")

  if (medusaSecret) {
    if (!process.env.REVALIDATE_SECRET || medusaSecret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
    }
    const { tags } = (await req.json()) as { tags?: string[] }
    for (const tag of tags ?? []) {
      revalidateTag(tag, { expire: 0 })
    }
    return NextResponse.json({ revalidated: tags ?? [] })
  }

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(
    req,
    process.env.SANITY_WEBHOOK_SECRET
  )
  if (!isValidSignature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 })
  }
  if (!body?._type) {
    return NextResponse.json({ message: "Missing _type" }, { status: 400 })
  }

  revalidateTag(`sanity:${body._type}`, { expire: 0 })
  return NextResponse.json({ revalidated: [`sanity:${body._type}`] })
}
