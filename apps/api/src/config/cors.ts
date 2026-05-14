import type { CorsOptions, CorsOptionsDelegate } from "cors";
import type { Request } from "express";
import { env } from "./env";
import { logger } from "../utils/logger";

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "https://jobautomation-web.vercel.app",
  "https://newjob.guru",
  "https://www.newjob.guru",
];

function parseOrigins(value: string) {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getAllowedCorsOrigins() {
  const configured = parseOrigins(env.corsOrigins);
  const origins = configured.length ? configured : defaultAllowedOrigins;
  if (env.appUrl && !origins.includes(env.appUrl)) origins.push(env.appUrl);
  return origins;
}

export const corsOptionsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.header("Origin");
  const allowedOrigins = getAllowedCorsOrigins();

  const corsOptions: CorsOptions = {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Content-Disposition"],
  };

  if (!origin) {
    callback(null, { ...corsOptions, origin: true });
    return;
  }

  if (allowedOrigins.includes(origin)) {
    callback(null, { ...corsOptions, origin });
    return;
  }

  if (env.nodeEnv === "production") {
    logger.warn(
      {
        origin,
        path: req.originalUrl,
        method: req.method,
      },
      "CORS blocked origin"
    );
  }

  callback(null, { ...corsOptions, origin: false });
};
