import pino from "pino";

const level = (process.env.LOG_LEVEL as pino.Level | undefined) ?? "info";

export const logger = pino({
  level,
  base: { service: "jobflow-workers" },
  formatters: {
    level(label: string) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
