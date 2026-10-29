"use client"

import Link from "next/link"
import React from "react"

/**
 * Thin wrapper around `<Link />`. The store is Australia-only, so URLs carry
 * no country prefix (see middleware.ts); kept so existing call sites work.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
