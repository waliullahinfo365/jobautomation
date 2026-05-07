import nodemailer from "nodemailer";

export type SmtpOutboundCredentials = {
  host: string;
  port: number;
  /** User preference: TLS (STARTTLS on 587) vs implicit SSL (465) */
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName?: string;
};

export type SendSmtpMailInput = SmtpOutboundCredentials & {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** Sends mail via tenant SMTP credentials (password never logged). */
export async function sendSmtpMail(input: SendSmtpMailInput): Promise<void> {
  const port = input.port || 587;
  let secure = input.secure;
  let requireTLS = false;
  if (port === 587 && input.secure) {
    secure = false;
    requireTLS = true;
  }
  if (port === 465) {
    secure = true;
  }

  const transporter = nodemailer.createTransport({
    host: input.host,
    port,
    secure,
    requireTLS,
    auth: {
      user: input.user,
      pass: input.pass,
    },
  });

  const fromHeader =
    input.fromName && input.fromName.trim().length > 0
      ? `"${input.fromName.replace(/"/g, "\\\"")}" <${input.from}>`
      : input.from;

  await transporter.sendMail({
    from: fromHeader,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
