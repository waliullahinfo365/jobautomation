/**
 * Resend HTTP client — thin re-export kept here for import path consistency.
 * Implementation lives in ../email/resend.service.ts.
 */
export {
  sendResendEmail,
  isResendConfigured,
  type SendResendEmailInput,
  type SendResendEmailResult,
} from "../email/resend.service";
