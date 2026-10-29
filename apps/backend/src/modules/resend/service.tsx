import { render } from "@react-email/render"
import type { ReactElement } from "react"
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type { Logger, NotificationTypes } from "@medusajs/framework/types"
import {
  mailtrapTransport,
  resendTransport,
  type EmailTransport,
  type MailtrapOptions,
} from "../../lib/email-transport"
import OrderPlacedEmail, { orderPlacedSubject } from "./emails/order-placed"
import OrderShippedEmail, { orderShippedSubject } from "./emails/order-shipped"
import {
  OrderCanceledEmail,
  PasswordResetEmail,
  WelcomeEmail,
} from "./emails/simple-emails"

export type ResendOptions = {
  api_key?: string
  from: string
  reply_to?: string
  /** Set in local dev to send to a Mailtrap test inbox instead of Resend. */
  mailtrap?: MailtrapOptions
}

export enum EmailTemplates {
  ORDER_PLACED = "order-placed",
  ORDER_SHIPPED = "order-shipped",
  ORDER_CANCELED = "order-canceled",
  PASSWORD_RESET = "password-reset",
  WELCOME = "welcome",
}

type InjectedDependencies = {
  logger: Logger
}

type Rendered = { subject: string; element: ReactElement }

const templates: Record<EmailTemplates, (data: any) => Rendered> = {
  [EmailTemplates.ORDER_PLACED]: (data) => ({
    subject: orderPlacedSubject(data.order),
    element: <OrderPlacedEmail order={data.order} />,
  }),
  [EmailTemplates.ORDER_SHIPPED]: (data) => ({
    subject: orderShippedSubject(data.order),
    element: <OrderShippedEmail order={data.order} tracking={data.tracking} />,
  }),
  [EmailTemplates.ORDER_CANCELED]: (data) => ({
    subject: `Order #${data.order.display_id} cancelled`,
    element: <OrderCanceledEmail order={data.order} />,
  }),
  [EmailTemplates.PASSWORD_RESET]: (data) => ({
    subject: "Reset your Ritz & Ron password",
    element: <PasswordResetEmail url={data.url} />,
  }),
  [EmailTemplates.WELCOME]: (data) => ({
    subject: "Welcome to Ritz & Ron",
    element: <WelcomeEmail firstName={data.first_name} />,
  }),
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  protected logger_: Logger
  protected options_: ResendOptions
  protected transport_: EmailTransport

  static validateOptions(options: Record<string, unknown>) {
    if (!(options.api_key || options.mailtrap) || !options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend notification provider requires `from` and either `api_key` or `mailtrap` options"
      )
    }
  }

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.transport_ = options.mailtrap
      ? mailtrapTransport(options.mailtrap)
      : resendTransport(options.api_key!)
    logger.info(`Email notifications are sent via ${this.transport_.name}`)
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    const build = templates[notification.template as EmailTemplates]
    if (!build) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unknown email template "${notification.template}"`
      )
    }

    const { subject, element } = build(notification.data ?? {})
    const html = await render(element)

    try {
      return await this.transport_.send({
        from: notification.from?.trim() || this.options_.from,
        replyTo: this.options_.reply_to,
        to: notification.to,
        subject: notification.content?.subject ?? subject,
        html,
      })
    } catch (e) {
      const message = (e as Error).message
      this.logger_.error(
        `${this.transport_.name} failed to send "${notification.template}": ${message}`
      )
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email: ${message}`
      )
    }
  }
}

export default ResendNotificationProviderService
