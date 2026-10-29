"use server"

import { isEmailConfigured, sendEmail } from "@lib/util/send-email"

export type ContactState =
  | { state: "error"; error: string }
  | { state: "success" }
  | null

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

/** Emails the enquiry to CONTACT_EMAIL with the customer as reply-to. */
export async function sendContactMessage(
  _currentState: ContactState,
  formData: FormData
): Promise<ContactState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company")) {
    return { state: "success" }
  }

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const order = String(formData.get("order") ?? "").trim()
  const message = String(formData.get("message") ?? "").trim()

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5) {
    return { state: "error", error: "Please fill in your name, a valid email and a message." }
  }
  if (message.length > 5000) {
    return { state: "error", error: "Your message is a little long — please shorten it." }
  }

  const to = process.env.CONTACT_EMAIL
  if (!isEmailConfigured() || !to) {
    console.warn("Contact form not configured (RESEND_API_KEY or MAILTRAP_*, and CONTACT_EMAIL)")
    return { state: "error", error: "Our contact form is unavailable right now. Please email us directly." }
  }

  try {
    await sendEmail({
      from: process.env.RESEND_FROM ?? "Ritz & Ron <orders@ritzandron.com.au>",
      to,
      replyTo: email,
      subject: `Website enquiry from ${name}${order ? ` (order ${order})` : ""}`,
      html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
      ${order ? `<p>Order: ${escapeHtml(order)}</p>` : ""}
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    })
  } catch (error) {
    console.error("Contact form send failed", error)
    return { state: "error", error: "Something went wrong. Please try again." }
  }
  return { state: "success" }
}
