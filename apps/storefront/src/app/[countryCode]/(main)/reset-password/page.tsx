import { Metadata } from "next"
import {
  RequestPasswordResetForm,
  ResetPasswordForm,
} from "@modules/account/components/password-reset"

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
}

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await props.searchParams

  return (
    <div className="content-container flex justify-center py-24">
      <div className="max-w-sm w-full flex flex-col items-center gap-y-6">
        <h1 className="text-4xl font-light">
          {token ? "Choose a new password" : "Forgot your password?"}
        </h1>
        {!token && (
          <p className="text-center text-base-regular text-ui-fg-subtle">
            Enter the email you shop with and we&apos;ll send you a link to
            reset it.
          </p>
        )}
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <RequestPasswordResetForm />
        )}
      </div>
    </div>
  )
}
