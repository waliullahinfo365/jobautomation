import pino from "pino";
import { env } from "../config/env";

const level = env.logLevel;

export const logger = pino({
  level,
  base: undefined,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createRequestLogger(requestId?: string, tenantId?: string) {
  return logger.child({
    requestId,
    tenantId,
  });
}
