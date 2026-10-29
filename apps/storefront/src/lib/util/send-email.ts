import "server-only"

import { Resend } from "resend"

type EmailMessage = {
  from: string
  to: string
  replyTo?: string
  subject: string
  html: string
}

// "Ritz & Ron <orders@x.com>" -> { name, email }
const parseAddress = (value: string) => {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  return match ? { name: match[1] || undefined, email: match[2] } : { email: value.trim() }
}

// Never in production, so real enquiries can't end up in a test inbox.
const mailtrap =
  process.env.NODE_ENV !== "production" &&
  process.env.MAILTRAP_API_TOKEN &&
  process.env.MAILTRAP_INBOX_ID
    ? { token: process.env.MAILTRAP_API_TOKEN, inbox: process.env.MAILTRAP_INBOX_ID }
    : null

/** True when the Mailtrap sandbox is in use (local dev only). */
export const isMailtrapActive = () => Boolean(mailtrap)

/** True when either Mailtrap (local dev) or Resend is configured. */
export const isEmailConfigured = () => Boolean(mailtrap || process.env.RESEND_API_KEY)

/**
 * Sends through the Mailtrap sandbox when it's configured (local dev: mail
 * lands in a test inbox, never a real person), otherwise through Resend.
 * Throws with the provider's message on failure.
 */
export async function sendEmail({ from, to, replyTo, subject, html }: EmailMessage) {
  if (mailtrap) {
    const res = await fetch(`https://sandbox.api.mailtrap.io/api/send/${mailtrap.inbox}`, {
      method: "POST",
      headers: { "Api-Token": mailtrap.token, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: parseAddress(from),
        to: [parseAddress(to)],
        reply_to: replyTo ? parseAddress(replyTo) : undefined,
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { errors?: string[] }
      throw new Error(`Mailtrap ${res.status}: ${body.errors?.join(", ") ?? res.statusText}`)
    }
    return
  }

  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from,
    to: [to],
    replyTo,
    subject,
    html,
  })
  if (error) {
    throw new Error(error.message)
  }
}
