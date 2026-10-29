import { Suspense } from "react"

import { ShoppingBag, User } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Wordmark from "@modules/common/components/wordmark"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

export const NAV_LINKS = [
  { name: "Shop", href: "/store" },
  { name: "Charms", href: "/categories/silver-charms" },
  { name: "Bracelets", href: "/categories/charm-bracelets" },
  { name: "Earrings", href: "/categories/earrings" },
  { name: "Necklaces", href: "/categories/necklaces" },
  { name: "Gifts", href: "/categories/gift-boxes" },
]

export default function Nav() {
  return (
    <div className="sticky top-0 inset-x-0 z-50 bg-paper">
      <header className="bg-paper">
        <nav className="content-container flex items-center justify-between h-12 small:h-14">
          <div className="flex items-center gap-x-6 h-full">
            <div className="small:hidden h-full">
              <SideMenu regions={null} locales={null} currentLocale={null} />
            </div>
            <LocalizedClientLink
              href="/"
              className="text-[24px] small:text-[30px] text-charcoal"
              data-testid="nav-store-link"
            >
              <Wordmark />
            </LocalizedClientLink>
            <ul className="hidden small:flex items-center gap-x-5 text-[14px] uppercase">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <LocalizedClientLink
                    href={link.href}
                    className="hover:opacity-60 transition-opacity"
                  >
                    {link.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-x-5 h-full text-charcoal">
            <Search />
            <LocalizedClientLink
              className="hidden small:flex items-center"
              href="/account"
              aria-label="Account"
              data-testid="nav-account-link"
            >
              <User className="w-[22px] h-[22px]" />
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="flex items-center"
                  href="/cart"
                  aria-label="Bag"
                  data-testid="nav-cart-link"
                >
                  <ShoppingBag className="w-[22px] h-[22px]" />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
