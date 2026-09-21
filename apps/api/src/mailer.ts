import nodemailer, { type Transporter } from "nodemailer";
import type { ApiConfig } from "./config.js";
import {
  renderResetPasswordTemplate,
  renderVerifyEmailTemplate,
} from "./email-templates.js";

export interface AuthMail {
  email: string;
  code: string;
  expiresAt: Date;
  kind: "verify-email" | "reset-password";
  appOrigin?: string | undefined;
}

export interface NotificationMail {
  email: string;
  subject: string;
  body: string;
  html?: string | undefined;
}

export interface RecordedAuthMail extends AuthMail {
  subject: string;
  text: string;
  html: string;
}

export interface RecordedNotificationMail extends NotificationMail {
  sentAt: Date;
}

export interface AuthMailer {
  send(message: AuthMail): Promise<void>;
  sendNotification?(message: NotificationMail): Promise<void>;
  verify?(): Promise<void>;
  close?(): void;
}

/** Captures auth messages for tests and local development. Never use it as a
 * production mail transport. */
export class MemoryAuthMailer implements AuthMailer {
  readonly messages: RecordedAuthMail[] = [];
  readonly notifications: RecordedNotificationMail[] = [];

  async send(message: AuthMail): Promise<void> {
    const isVerification = message.kind === "verify-email";
    const appOrigin = message.appOrigin ?? "https://fehmequran.org";
    const rendered = isVerification
      ? renderVerifyEmailTemplate({
          email: message.email,
          code: message.code,
          expiresAt: message.expiresAt,
          appOrigin,
        })
      : renderResetPasswordTemplate({
          email: message.email,
          code: message.code,
          expiresAt: message.expiresAt,
          appOrigin,
        });

    this.messages.push({
      ...message,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
  }

  async sendNotification(message: NotificationMail): Promise<void> {
    this.notifications.push({
      ...message,
      sentAt: new Date(),
    });
  }

  latest(email: string, kind: AuthMail["kind"]): RecordedAuthMail | undefined {
    return [...this.messages]
      .reverse()
      .find((message) => message.email === email && message.kind === kind);
  }
}

export class SmtpAuthMailer implements AuthMailer {
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly appOrigin: string;

  constructor(options: NonNullable<ApiConfig["smtp"]>) {
    this.from = options.from;
    this.appOrigin = options.appOrigin ?? "https://fehmequran.org";

    const transportOptions: Record<string, unknown> = {
      tls: {
        rejectUnauthorized: false,
      },
    };

    if (options.service) {
      transportOptions.service = options.service;
    } else {
      transportOptions.host = options.host;
      transportOptions.port = options.port;
      transportOptions.secure = options.secure;
    }

    if (options.user && options.password) {
      transportOptions.auth = {
        user: options.user,
        pass: options.password,
      };
    }

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async verify(): Promise<void> {
    await this.transporter.verify();
  }

  async send(message: AuthMail): Promise<void> {
    const isVerification = message.kind === "verify-email";
    const appOrigin = message.appOrigin ?? this.appOrigin;
    const rendered = isVerification
      ? renderVerifyEmailTemplate({
          email: message.email,
          code: message.code,
          expiresAt: message.expiresAt,
          appOrigin,
        })
      : renderResetPasswordTemplate({
          email: message.email,
          code: message.code,
          expiresAt: message.expiresAt,
          appOrigin,
        });

    await this.transporter.sendMail({
      from: this.from,
      to: message.email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
  }

  async sendNotification(message: NotificationMail): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.email,
      subject: message.subject,
      text: message.body,
      ...(message.html ? { html: message.html } : {}),
    });
  }

  close(): void {
    this.transporter.close();
  }
}

export function createRuntimeAuthMailer(config: ApiConfig): AuthMailer {
  if (config.smtp) return new SmtpAuthMailer(config.smtp);
  if (config.environment === "production") {
    throw new Error("Production API cannot start without an SMTP auth mail transport");
  }
  return new MemoryAuthMailer();
}
