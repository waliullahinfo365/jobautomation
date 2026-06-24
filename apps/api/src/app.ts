import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptionsDelegate } from "./config/cors";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { apiRoutes } from "./routes";
import { logger } from "./utils/logger";

const JSON_BODY_LIMIT = "1mb";

function isStripeWebhookRequest(req: express.Request): boolean {
  const pathname = (req.originalUrl ?? req.url ?? "").split("?")[0];
  return pathname === "/billing/webhook" || pathname.endsWith("/billing/webhook");
}

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.set("etag", false);
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      hidePoweredBy: true,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors(corsOptionsDelegate));
  app.options("*", cors(corsOptionsDelegate));

  if (env.nodeEnv !== "production") {
    app.use(morgan("dev"));
  } else {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        logger.info({
          requestId: req.requestId,
          tenantId: req.user?.tenantId ?? req.tenantId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          ms: Date.now() - start,
        });
      });
      next();
    });
  }

  // Capture raw body for Stripe webhook signature verification before JSON parsing
  app.use((req, res, next) => {
    if (!isStripeWebhookRequest(req)) return next();

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("error", next);
    req.on("end", () => {
      const raw = Buffer.concat(chunks);
      (req as express.Request & { rawBody: Buffer }).rawBody = raw;
      try {
        (req as express.Request & { body: unknown }).body = JSON.parse(raw.toString("utf8"));
      } catch {
        (req as express.Request & { body: unknown }).body = {};
      }
      next();
    });
  });

  const jsonParser = express.json({ limit: JSON_BODY_LIMIT });
  app.use((req, res, next) => {
    if (isStripeWebhookRequest(req)) return next();
    jsonParser(req, res, next);
  });

  const urlencodedParser = express.urlencoded({ extended: true });
  app.use((req, res, next) => {
    if (isStripeWebhookRequest(req)) return next();
    urlencodedParser(req, res, next);
  });
  app.use(apiRoutes);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
