"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { BarsThree, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Wordmark from "@modules/common/components/wordmark"
import { Fragment } from "react"
import { Locale } from "@lib/data/locales"

const PRIMARY_LINKS = [
  { name: "Shop all", href: "/store" },
  { name: "Silver charms", href: "/categories/silver-charms" },
  { name: "Charm bracelets", href: "/categories/charm-bracelets" },
  { name: "Earrings", href: "/categories/earrings" },
  { name: "Necklaces", href: "/categories/necklaces" },
  { name: "Gifts", href: "/categories/gift-boxes" },
]

const SECONDARY_LINKS = [
  { name: "Account", href: "/account" },
  { name: "Our story", href: "/about" },
  { name: "Journal", href: "/journal" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

// Australia is the only region, so the starter's country/language pickers are omitted.
const SideMenu = (_props: SideMenuProps) => {
  return (
    <Popover className="h-full flex">
      {({ open, close }) => (
        <>
          <PopoverButton
            data-testid="nav-menu-button"
            aria-label="Open menu"
            className="relative h-full flex items-center focus:outline-none"
          >
            <BarsThree className="w-[22px] h-[22px]" />
          </PopoverButton>

          {open && (
            <div
              className="fixed inset-0 z-[50] bg-charcoal/20"
              onClick={close}
              data-testid="side-menu-backdrop"
            />
          )}

          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <PopoverPanel
              data-testid="nav-menu-popup"
              className="fixed inset-y-0 left-0 z-[51] w-[86vw] max-w-sm bg-paper flex flex-col px-5 py-5"
            >
              <div className="flex items-center justify-between mb-10">
                <Wordmark className="text-[22px]" />
                <button
                  data-testid="close-menu-button"
                  onClick={close}
                  aria-label="Close menu"
                >
                  <XMark />
                </button>
              </div>
              <ul className="flex flex-col gap-4">
                {PRIMARY_LINKS.map((link) => (
                  <li key={link.href}>
                    <LocalizedClientLink
                      href={link.href}
                      className="text-2xl tracking-[-0.04em] text-charcoal"
                      onClick={close}
                    >
                      {link.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
              <ul className="mt-auto flex flex-col gap-2.5 border-t border-hairline pt-6 text-sm">
                {SECONDARY_LINKS.map((link) => (
                  <li key={link.href}>
                    <LocalizedClientLink href={link.href} onClick={close}>
                      {link.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  )
}

export default SideMenu
