import http from "node:http";
import { connectDatabase, disconnectDatabase } from "@jobflow/database";
import { createApp } from "./app";
import { getAllowedCorsOrigins } from "./config/cors";
import { validateApiEnv } from "./config/validate-env";
import { env, requireJwtSecretInProduction } from "./config/env";
import { requestShutdown } from "./shutdown";
import { logger } from "./utils/logger";

async function bootstrap() {
  validateApiEnv();
  requireJwtSecretInProduction();
  logger.info({ nodeEnv: env.nodeEnv, allowedCorsOrigins: getAllowedCorsOrigins() }, "API CORS configuration loaded");
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(env.port, () => {
      logger.info({ port: env.port }, "jobflow-api listening");
      resolve();
    });
  });

  let exiting = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (exiting) return;
    exiting = true;
    requestShutdown();
    logger.info({ signal }, "shutdown signal received, draining connections");
    server.close(async (closeErr) => {
      if (closeErr) {
        logger.error(closeErr, "error closing HTTP server");
      }
      try {
        await disconnectDatabase();
        logger.info("database disconnected");
      } catch (e) {
        logger.error(e, "error disconnecting database");
      }
      logger.info("shutdown complete");
      process.exit(closeErr ? 1 : 0);
    });
    setTimeout(() => {
      logger.error("shutdown timed out, forcing exit");
      process.exit(1);
    }, 25_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  logger.error(error, "Failed to start API server");
  process.exit(1);
});
