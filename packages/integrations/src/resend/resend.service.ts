/**
 * Resend service — higher-level helpers built on top of the raw client.
 * Primary entry point for workers and API that need tenant-scoped email delivery.
 */
export {
  sendResendEmail,
  isResendConfigured,
  type SendResendEmailInput,
  type SendResendEmailResult,
} from "../email/resend.service";
