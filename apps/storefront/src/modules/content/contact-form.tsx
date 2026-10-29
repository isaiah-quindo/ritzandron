"use client"

import { ContactState, sendContactMessage } from "@lib/data/contact"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

export default function ContactForm() {
  const [state, formAction] = useActionState<ContactState, FormData>(
    sendContactMessage,
    null
  )

  if (state?.state === "success") {
    return (
      <p className="text-2xl text-charcoal" role="status">
        Thank you — we&apos;ll be in touch within one business day.
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 small:grid-cols-2 gap-3">
        <Input label="Name" name="name" autoComplete="name" required />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <Input label="Order number (optional)" name="order" />
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <label className="sr-only" htmlFor="contact-message">
        Message
      </label>
      <textarea
        id="contact-message"
        name="message"
        required
        rows={6}
        placeholder="How can we help?"
        className="w-full border border-ui-border-base bg-white px-4 py-3 text-base-regular outline-none focus:border-charcoal placeholder:text-stone"
      />
      <ErrorMessage error={state?.state === "error" ? state.error : null} />
      <SubmitButton className="self-start mt-2">Send message</SubmitButton>
    </form>
  )
}
