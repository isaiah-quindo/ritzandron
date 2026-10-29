"use client"

import { HttpTypes } from "@medusajs/types"
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react"

type SquareCard = {
  attach: (selector: string | HTMLElement) => Promise<void>
  tokenize: (verificationDetails?: Record<string, unknown>) => Promise<{
    status: string
    token?: string
    errors?: { message: string }[]
  }>
  destroy: () => Promise<boolean>
}

declare global {
  interface Window {
    Square?: {
      payments: (
        appId: string,
        locationId: string
      ) => { card: (options?: Record<string, unknown>) => Promise<SquareCard> }
    }
  }
}

export type SquareCardHandle = {
  /** Returns a single-use card token, throwing with a customer-facing message on failure. */
  tokenize: () => Promise<string>
}

const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? ""
const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? ""
const sdkUrl = appId.startsWith("sandbox-")
  ? "https://sandbox.web.squarecdn.com/v1/square.js"
  : "https://web.squarecdn.com/v1/square.js"

let sdkPromise: Promise<void> | null = null

function loadSquareSdk() {
  sdkPromise ??= new Promise<void>((resolve, reject) => {
    if (window.Square) {
      return resolve()
    }
    const script = document.createElement("script")
    script.src = sdkUrl
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      sdkPromise = null
      reject(new Error("Could not load the payment form"))
    }
    document.head.appendChild(script)
  })
  return sdkPromise
}

// Matches the storefront's paper/charcoal palette inside Square's iframe.
const cardStyle = {
  input: {
    color: "#141414",
    fontSize: "15px",
    fontFamily: "sans-serif",
  },
  "input::placeholder": { color: "#6F6F6F" },
  ".input-container": {
    borderColor: "#E8E8E8",
    borderRadius: "4px",
  },
  ".input-container.is-focus": { borderColor: "#141414" },
  ".message-text": { color: "#6F6F6F" },
}

export default function SquareCardForm({
  cart,
  onReady,
  ref,
}: {
  cart: HttpTypes.StoreCart
  onReady?: (ready: boolean) => void
  ref?: Ref<SquareCardHandle>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<SquareCard | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!appId || !locationId) {
      setLoadError("Card payments are not configured.")
      return
    }

    loadSquareSdk()
      .then(async () => {
        const payments = window.Square!.payments(appId, locationId)
        const card = await payments.card({ style: cardStyle })
        if (cancelled || !containerRef.current) {
          await card.destroy()
          return
        }
        await card.attach(containerRef.current)
        cardRef.current = card
        onReady?.(true)
      })
      .catch((e: Error) => setLoadError(e.message))

    return () => {
      cancelled = true
      onReady?.(false)
      cardRef.current?.destroy()
      cardRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    tokenize: async () => {
      if (!cardRef.current) {
        throw new Error("The payment form is still loading.")
      }
      const billing = cart.billing_address
      // Passing verification details lets Square run 3-D Secure (SCA) when the
      // issuing bank requires it, and bakes the result into the token.
      const result = await cardRef.current.tokenize({
        amount: Number(cart.total ?? 0).toFixed(2),
        currencyCode: (cart.currency_code ?? "aud").toUpperCase(),
        intent: "CHARGE",
        customerInitiated: true,
        sellerKeyedIn: false,
        billingContact: {
          givenName: billing?.first_name ?? undefined,
          familyName: billing?.last_name ?? undefined,
          email: cart.email ?? undefined,
          phone: billing?.phone ?? undefined,
          addressLines: [billing?.address_1, billing?.address_2].filter(Boolean),
          city: billing?.city ?? undefined,
          state: billing?.province ?? undefined,
          postalCode: billing?.postal_code ?? undefined,
          countryCode: billing?.country_code?.toUpperCase(),
        },
      })
      if (result.status !== "OK" || !result.token) {
        throw new Error(
          result.errors?.[0]?.message ?? "Please check your card details."
        )
      }
      return result.token
    },
  }))

  return (
    <div className="mb-6">
      <div ref={containerRef} data-testid="square-card-container" />
      {loadError && (
        <p className="text-small-regular text-rose-700 mt-2">{loadError}</p>
      )}
      <p className="text-xsmall-regular text-ui-fg-muted mt-1">
        Payments are processed securely by Square. Your card details never
        touch our servers.
      </p>
    </div>
  )
}
