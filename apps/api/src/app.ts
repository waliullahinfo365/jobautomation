import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { apiRoutes } from "./routes";
import { logger } from "./utils/logger";

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
  app.use(cors(corsOptions));

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

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(apiRoutes);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
