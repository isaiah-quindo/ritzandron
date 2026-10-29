"use client"

import { NewsletterState, subscribeToNewsletter } from "@lib/data/newsletter"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

const SubmitButton = () => {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 h-10 px-4 rounded-[4px] text-[13px] font-medium bg-charcoal text-paper hover:bg-charcoal-soft transition-colors disabled:opacity-50"
    >
      {pending ? "Subscribing" : "Subscribe"}
    </button>
  )
}

export default function NewsletterForm() {
  const [state, formAction] = useActionState<NewsletterState, FormData>(
    subscribeToNewsletter,
    null
  )

  if (state?.state === "success") {
    return (
      <p className="text-[13px] text-charcoal" role="status">
        Thank you, you&apos;re on the list.
      </p>
    )
  }

  return (
    <form action={formAction} className="w-full">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="E-mail"
          autoComplete="email"
          className="flex-1 min-w-0 h-10 px-3 rounded-[4px] text-[13px] bg-mist outline-none placeholder:text-stone focus:ring-1 focus:ring-charcoal"
        />
        <SubmitButton />
      </div>
      {state?.state === "error" && (
        <p className="text-xs text-rose-700 mt-2">{state.error}</p>
      )}
    </form>
  )
}
