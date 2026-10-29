import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Instrument_Serif } from "next/font/google"
import "styles/globals.css"

// Logo only; all other text uses the system sans stack (see tailwind.config.js).
const logo = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-logo",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Ritz & Ron | Sterling Silver Jewellery & Charms",
    template: "%s | Ritz & Ron",
  },
  description:
    "Sterling silver charms, bracelets, earrings and necklaces, hand-picked and shipped from NSW. Free shipping Australia-wide over $99.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" data-mode="light" className={logo.variable}>
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
