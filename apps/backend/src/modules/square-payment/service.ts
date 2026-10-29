import { randomUUID } from "crypto"
import { SquareClient, SquareEnvironment, SquareError, WebhooksHelper } from "square"
import type { Square } from "square"
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

export type SquareOptions = {
  accessToken: string
  locationId: string
  environment?: "sandbox" | "production"
  /**
   * Capture the payment as soon as the order is placed. When false, payments
   * are only authorized and must be captured from the admin within 6 days.
   */
  capture?: boolean
  webhookSignatureKey?: string
  /** Public URL Square posts webhooks to, e.g. https://api.example.com/hooks/payment/square_square */
  webhookUrl?: string
}

/**
 * Session data stored by Medusa. Everything outside `client` is written by this
 * provider; `client` holds untrusted storefront input (the Web Payments SDK token).
 */
type SquareSessionData = {
  session_id?: string
  amount?: number
  currency_code?: string
  payment_id?: string
  status?: Square.Payment["status"]
  client?: { source_id?: string; verification_token?: string }
}

type InjectedDependencies = {
  logger: Logger
}

// Square caps idempotency keys at 45 characters.
const idempotencyKey = (key?: string) => (key ?? randomUUID()).slice(0, 45)

// AUD and every currency we sell in has two decimal places.
const toMinorUnits = (amount: unknown) =>
  BigInt(Math.round(new BigNumber(amount as number).numeric * 100))

const fromMinorUnits = (amount?: bigint | null) => Number(amount ?? 0) / 100

class SquarePaymentProviderService extends AbstractPaymentProvider<SquareOptions> {
  static identifier = "square"

  protected logger_: Logger
  protected options_: SquareOptions
  protected client_: SquareClient

  static validateOptions(options: Record<string, unknown>) {
    if (!options.accessToken || !options.locationId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Square payment provider requires `accessToken` and `locationId` options"
      )
    }
  }

  constructor(container: InjectedDependencies, options: SquareOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
    this.client_ = new SquareClient({
      token: options.accessToken,
      environment:
        options.environment === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    })
  }

  /** Keeps only JSON-safe fields; Square payments contain BigInt values. */
  private toSessionData(
    payment: Square.Payment,
    data: SquareSessionData
  ): Record<string, unknown> {
    return {
      ...data,
      client: null,
      payment_id: payment.id,
      status: payment.status,
      amount: fromMinorUnits(payment.amountMoney?.amount),
      card_brand: payment.cardDetails?.card?.cardBrand ?? null,
      card_last_4: payment.cardDetails?.card?.last4 ?? null,
      receipt_url: payment.receiptUrl ?? null,
    }
  }

  private mapStatus(status?: string): PaymentSessionStatus {
    switch (status) {
      case "APPROVED":
        return PaymentSessionStatus.AUTHORIZED
      case "COMPLETED":
        return PaymentSessionStatus.CAPTURED
      case "CANCELED":
        return PaymentSessionStatus.CANCELED
      case "FAILED":
        return PaymentSessionStatus.ERROR
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  private buildError(message: string, error: unknown) {
    const detail =
      error instanceof SquareError
        ? error.errors.map((e) => e.detail ?? e.code).join("; ")
        : (error as Error)?.message
    return new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `${message}: ${detail}`
    )
  }

  async initiatePayment({
    amount,
    currency_code,
    data,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = (data?.session_id as string) ?? randomUUID()
    // No Square call yet: the card token only exists once the customer
    // submits the Web Payments SDK form, so the payment is created on authorize.
    return {
      id: sessionId,
      status: PaymentSessionStatus.PENDING,
      data: {
        session_id: sessionId,
        amount: new BigNumber(amount).numeric,
        currency_code,
      },
    }
  }

  async updatePayment({
    amount,
    currency_code,
    data,
  }: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return {
      status: PaymentSessionStatus.PENDING,
      data: {
        ...data,
        amount: new BigNumber(amount).numeric,
        currency_code,
      },
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const data = (input.data ?? {}) as SquareSessionData

    // Idempotent: the session was already authorized against Square.
    if (data.payment_id) {
      return this.getPaymentStatus(input)
    }

    const sourceId = data.client?.source_id
    if (!sourceId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing card token. Please re-enter your card details."
      )
    }

    const customer = input.context?.customer
    try {
      const { payment } = await this.client_.payments.create({
        sourceId,
        verificationToken: data.client?.verification_token,
        idempotencyKey: idempotencyKey(data.session_id),
        amountMoney: {
          amount: toMinorUnits(data.amount),
          currency: (data.currency_code ?? "aud").toUpperCase() as Square.Currency,
        },
        autocomplete: this.options_.capture ?? true,
        locationId: this.options_.locationId,
        referenceId: data.session_id,
        buyerEmailAddress: customer?.email ?? undefined,
        note: "Ritz & Ron online order",
      })

      if (!payment) {
        throw new Error("Square returned no payment")
      }

      return {
        status: this.mapStatus(payment.status),
        data: this.toSessionData(payment, data),
      }
    } catch (error) {
      throw this.buildError("Your card could not be charged", error)
    }
  }

  async capturePayment({
    data,
    context,
  }: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const session = (data ?? {}) as SquareSessionData
    if (!session.payment_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No Square payment to capture")
    }
    if (session.status === "COMPLETED") {
      return { data }
    }

    try {
      const { payment } = await this.client_.payments.complete({
        paymentId: session.payment_id,
      })
      return { data: this.toSessionData(payment!, session) }
    } catch (error) {
      const { payment } = await this.client_.payments
        .get({ paymentId: session.payment_id })
        .catch(() => ({ payment: undefined }))
      if (payment?.status === "COMPLETED") {
        return { data: this.toSessionData(payment, session) }
      }
      this.logger_.error(
        `Square capture failed for ${session.payment_id} (${context?.idempotency_key})`
      )
      throw this.buildError("An error occurred in capturePayment", error)
    }
  }

  async refundPayment({
    amount,
    data,
    context,
  }: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const session = (data ?? {}) as SquareSessionData
    if (!session.payment_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No Square payment to refund")
    }

    try {
      await this.client_.refunds.refundPayment({
        paymentId: session.payment_id,
        idempotencyKey: idempotencyKey(context?.idempotency_key),
        amountMoney: {
          amount: toMinorUnits(amount),
          currency: (session.currency_code ?? "aud").toUpperCase() as Square.Currency,
        },
      })
      return { data }
    } catch (error) {
      throw this.buildError("An error occurred in refundPayment", error)
    }
  }

  async cancelPayment({ data }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const session = (data ?? {}) as SquareSessionData
    if (!session.payment_id || session.status !== "APPROVED") {
      return { data }
    }

    try {
      const { payment } = await this.client_.payments.cancel({
        paymentId: session.payment_id,
      })
      return { data: this.toSessionData(payment!, session) }
    } catch (error) {
      throw this.buildError("An error occurred in cancelPayment", error)
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const session = (input.data ?? {}) as SquareSessionData
    if (!session.payment_id) {
      return { status: PaymentSessionStatus.PENDING, data: input.data }
    }

    const { payment } = await this.client_.payments.get({
      paymentId: session.payment_id,
    })
    return {
      status: this.mapStatus(payment?.status),
      data: payment ? this.toSessionData(payment, session) : input.data,
    }
  }

  async retrievePayment({ data }: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const session = (data ?? {}) as SquareSessionData
    if (!session.payment_id) {
      return { data }
    }
    const { payment } = await this.client_.payments.get({
      paymentId: session.payment_id,
    })
    return { data: payment ? this.toSessionData(payment, session) : data }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { webhookSignatureKey, webhookUrl } = this.options_
    if (!webhookSignatureKey || !webhookUrl) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const isValid = await WebhooksHelper.verifySignature({
      requestBody: payload.rawData.toString(),
      signatureHeader: payload.headers["x-square-hmacsha256-signature"] as string,
      signatureKey: webhookSignatureKey,
      notificationUrl: webhookUrl,
    })
    if (!isValid) {
      this.logger_.warn("Rejected Square webhook with invalid signature")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const event = payload.data as {
      type?: string
      data?: { object?: { payment?: Record<string, any> } }
    }
    const payment = event.data?.object?.payment
    // Only payments created by this provider carry our session id as reference.
    if (event.type !== "payment.updated" || !payment?.reference_id) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const sessionData = {
      session_id: payment.reference_id as string,
      amount: fromMinorUnits(BigInt(payment.amount_money?.amount ?? 0)),
    }
    switch (payment.status) {
      case "APPROVED":
        return { action: PaymentActions.AUTHORIZED, data: sessionData }
      case "COMPLETED":
        return { action: PaymentActions.SUCCESSFUL, data: sessionData }
      case "CANCELED":
        return { action: PaymentActions.CANCELED, data: sessionData }
      case "FAILED":
        return { action: PaymentActions.FAILED, data: sessionData }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }
}

export default SquarePaymentProviderService
