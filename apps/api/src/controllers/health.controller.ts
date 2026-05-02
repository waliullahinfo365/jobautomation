import type { Request, Response } from "express";
import { getDatabaseStatus } from "@jobflow/database";
import { env } from "../config/env";
import { getApiQueueReport } from "../config/queue";
import { isShuttingDown } from "../shutdown";

function serviceVersion(): string {
  return process.env.SERVICE_VERSION ?? process.env.npm_package_version ?? "0.1.0";
}

export function healthSummary(_req: Request, res: Response) {
  const db = getDatabaseStatus();
  const queue = getApiQueueReport();
  res.json({
    success: true,
    service: "jobflow-api",
    status: "ok",
    version: serviceVersion(),
    environment: env.nodeEnv,
    uptime: process.uptime(),
    database: {
      status: db.state,
    },
    queue,
  });
}

export function healthLive(_req: Request, res: Response) {
  if (isShuttingDown()) {
    return res.status(503).json({
      success: false,
      service: "jobflow-api",
      status: "shutting_down",
    });
  }
  res.json({
    success: true,
    service: "jobflow-api",
    status: "live",
  });
}

export function healthReady(_req: Request, res: Response) {
  const db = getDatabaseStatus();
  if (db.state === "connected") {
    return res.status(200).json({
      success: true,
      service: "jobflow-api",
      status: "ready",
      database: { status: db.state },
    });
  }
  return res.status(503).json({
    success: false,
    service: "jobflow-api",
    status: "not_ready",
    database: { status: db.state },
  });
}
