import { MedusaError } from "@medusajs/framework/utils"
import { Resend } from "resend"

export type EmailMessage = {
  from: string
  to: string
  replyTo?: string
  subject: string
  html: string
}

export type MailtrapOptions = {
  api_token: string
  inbox_id: string
}

/**
 * Sends through the Mailtrap sandbox when it's configured (local dev: mail
 * lands in a test inbox, never a real customer), otherwise through Resend.
 */
export type EmailTransport = {
  name: "mailtrap" | "resend"
  send: (message: EmailMessage) => Promise<{ id: string }>
}

// "Ritz & Ron <orders@x.com>" -> { name, email }
const parseAddress = (value: string) => {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  return match ? { name: match[1] || undefined, email: match[2] } : { email: value.trim() }
}

export function mailtrapTransport({ api_token, inbox_id }: MailtrapOptions): EmailTransport {
  return {
    name: "mailtrap",
    async send({ from, to, replyTo, subject, html }) {
      const res = await fetch(`https://sandbox.api.mailtrap.io/api/send/${inbox_id}`, {
        method: "POST",
        headers: { "Api-Token": api_token, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: parseAddress(from),
          to: [parseAddress(to)],
          reply_to: replyTo ? parseAddress(replyTo) : undefined,
          subject,
          html,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        message_ids?: string[]
        errors?: string[]
      }
      if (!res.ok) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Mailtrap ${res.status}: ${body.errors?.join(", ") ?? res.statusText}`
        )
      }
      return { id: body.message_ids?.[0] ?? "mailtrap" }
    },
  }
}

export function resendTransport(apiKey: string): EmailTransport {
  const resend = new Resend(apiKey)
  return {
    name: "resend",
    async send({ from, to, replyTo, subject, html }) {
      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        replyTo,
        subject,
        html,
      })
      if (error || !data) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          error?.message ?? "unknown error"
        )
      }
      return { id: data.id }
    },
  }
}
