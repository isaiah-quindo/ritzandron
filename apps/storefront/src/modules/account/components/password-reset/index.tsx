"use client"

import {
  PasswordResetState,
  requestPasswordReset,
  resetPassword,
} from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

export function RequestPasswordResetForm() {
  const [state, formAction] = useActionState<PasswordResetState, FormData>(
    requestPasswordReset,
    null
  )

  if (state?.state === "success") {
    return (
      <p className="text-base-regular text-center" data-testid="reset-requested">
        If an account exists for that email, a reset link is on its way. Check
        your inbox (and spam folder).
      </p>
    )
  }

  return (
    <form className="w-full flex flex-col gap-y-2" action={formAction}>
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <ErrorMessage error={state?.state === "error" ? state.error : null} />
      <SubmitButton className="w-full mt-4">Send reset link</SubmitButton>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<PasswordResetState, FormData>(
    resetPassword,
    null
  )

  if (state?.state === "success") {
    return (
      <p className="text-base-regular text-center" data-testid="reset-complete">
        Your password has been updated.{" "}
        <LocalizedClientLink href="/account" className="underline">
          Sign in
        </LocalizedClientLink>
      </p>
    )
  }

  return (
    <form className="w-full flex flex-col gap-y-2" action={formAction}>
      <input type="hidden" name="token" value={token} />
      <Input label="New password" name="password" type="password" autoComplete="new-password" required />
      <Input label="Confirm password" name="confirm_password" type="password" autoComplete="new-password" required />
      <ErrorMessage error={state?.state === "error" ? state.error : null} />
      <SubmitButton className="w-full mt-4">Update password</SubmitButton>
    </form>
  )
}
