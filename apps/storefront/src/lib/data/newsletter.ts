"use server"

import { isMailtrapActive } from "@lib/util/send-email"
import { Resend } from "resend"

export type NewsletterState =
  | { state: "error"; error: string }
  | { state: "success" }
  | null

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Adds the subscriber to Resend contacts, in RESEND_NEWSLETTER_SEGMENT_ID when set. */
export async function subscribeToNewsletter(
  _currentState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { state: "error", error: "Please enter a valid email address." }
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn(`Newsletter signup for ${email} skipped: RESEND_API_KEY not set`)
    return { state: "success" }
  }
  // Mailtrap means local dev: keep test signups out of the real audience.
  if (isMailtrapActive()) {
    console.info(`Newsletter signup for ${email} skipped: Mailtrap (dev) is configured`)
    return { state: "success" }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID
  const { error } = await resend.contacts.create({
    email,
    unsubscribed: false,
    segments: segmentId ? [{ id: segmentId }] : undefined,
  })

  // An existing contact is fine: they're already subscribed.
  if (error && !/already exists/i.test(error.message)) {
    console.error("Newsletter signup failed", error)
    return { state: "error", error: "Something went wrong. Please try again." }
  }
  return { state: "success" }
}
