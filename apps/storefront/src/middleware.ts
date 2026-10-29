import { NextRequest, NextResponse } from "next/server"
import { DEFAULT_COUNTRY_CODE } from "@lib/util/country"

/**
 * The store only sells in Australia, so URLs carry no country prefix.
 * Pages still live under `app/[countryCode]` (the Medusa data layer reads the
 * region from it); requests are rewritten there internally, and any legacy
 * `/au/...` URL is permanently redirected to its clean equivalent.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname.includes(".")) {
    return NextResponse.next()
  }

  const prefix = `/${DEFAULT_COUNTRY_CODE}`
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(prefix.length) || "/"
    url.search = search
    return NextResponse.redirect(url, 308)
  }

  const response = NextResponse.rewrite(
    new URL(`${prefix}${pathname === "/" ? "" : pathname}${search}`, request.url)
  )

  if (!request.cookies.get("_medusa_cache_id")) {
    response.cookies.set("_medusa_cache_id", crypto.randomUUID(), {
      maxAge: 60 * 60 * 24,
    })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|studio|ucp|buy|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
