import { getSiteSettings } from "@cms/queries"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Wordmark from "@modules/common/components/wordmark"
import NewsletterForm from "@modules/layout/components/newsletter-form"

const SHOP_LINKS = [
  { name: "Silver charms", href: "/categories/silver-charms" },
  { name: "Charm bracelets", href: "/categories/charm-bracelets" },
  { name: "Earrings", href: "/categories/earrings" },
  { name: "Necklaces", href: "/categories/necklaces" },
  { name: "Gift boxes", href: "/categories/gift-boxes" },
]

const HELP_LINKS = [
  { name: "Shipping", href: "/shipping" },
  { name: "Returns & exchanges", href: "/returns" },
  { name: "Jewellery care", href: "/care" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
]

const ABOUT_LINKS = [
  { name: "Our story", href: "/about" },
  { name: "Journal", href: "/journal" },
  { name: "Privacy policy", href: "/privacy" },
  { name: "Terms of service", href: "/terms" },
]

const FooterColumn = ({
  title,
  links,
}: {
  title: string
  links: { name: string; href: string }[]
}) => (
  <div className="flex flex-col gap-y-3">
    <h2 className="text-[13px] font-medium">{title}</h2>
    <ul className="flex flex-col gap-y-1.5 text-[13px] text-charcoal-soft">
      {links.map((link) => (
        <li key={link.href}>
          <LocalizedClientLink href={link.href} className="hover:text-charcoal">
            {link.name}
          </LocalizedClientLink>
        </li>
      ))}
    </ul>
  </div>
)

export default async function Footer() {
  const settings = await getSiteSettings()
  const socials = [
    { name: "Instagram", href: settings?.instagram },
    { name: "TikTok", href: settings?.tiktok },
    { name: "Facebook", href: settings?.facebook },
  ].filter((s) => s.href)

  return (
    <footer className="border-t border-hairline w-full mt-20">
      <div className="content-container">
        <div className="grid grid-cols-2 small:grid-cols-[1fr_1fr_1fr_1.4fr] gap-x-6 gap-y-10 py-12">
          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Help" links={HELP_LINKS} />
          <FooterColumn title="Ritz & Ron" links={ABOUT_LINKS} />
          <div className="col-span-2 small:col-span-1 flex flex-col gap-y-3">
            <h2 className="text-[13px] font-medium">
              {settings?.newsletterHeading ?? "Join the email list"}
            </h2>
            <NewsletterForm />
            {socials.length > 0 && (
              <ul className="flex gap-4 text-[13px] mt-2">
                {socials.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:opacity-60"
                    >
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex flex-col small:flex-row gap-3 justify-between small:items-center border-t border-hairline py-6 text-[12px] text-stone">
          <span>
            © {new Date().getFullYear()} Ritz &amp; Ron. Australian owned,
            shipped from NSW.
          </span>
          <Wordmark className="text-[18px] text-charcoal" />
        </div>
      </div>
    </footer>
  )
}
