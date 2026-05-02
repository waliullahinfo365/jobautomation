/**
 * Worker entry point — designed for deployment on Railway as a separate service.
 * Each worker runs on its own cron schedule defined in /config/constants.ts.
 *
 * To run locally: npm run workers:dev
 * To deploy:      point Railway start command to this file via ts-node.
 */

import { WORKER_SCHEDULES } from "@/lib/constants";
import { connectDB } from "@/lib/db";

// TODO: Import actual cron scheduler (e.g. node-cron) and register each worker.
// import cron from "node-cron";

async function bootstrap() {
  console.log("[Workers] Connecting to database…");
  await connectDB();
  console.log("[Workers] Database connected.");

  console.log("[Workers] Registering schedules…");

  // TODO: Register each worker with its schedule:
  // cron.schedule(WORKER_SCHEDULES.dailyDigest,      () => import("./daily-digest.worker").then(m => m.run()));
  // cron.schedule(WORKER_SCHEDULES.weeklyReport,     () => import("./weekly-report.worker").then(m => m.run()));
  // cron.schedule(WORKER_SCHEDULES.deadlineAlert,    () => import("./deadline-alert.worker").then(m => m.run()));
  // cron.schedule(WORKER_SCHEDULES.emailReplyCheck,  () => import("./email-reply-detection.worker").then(m => m.run()));
  // cron.schedule(WORKER_SCHEDULES.followUpReminder, () => import("./follow-up-reminder.worker").then(m => m.run()));
  // cron.schedule(WORKER_SCHEDULES.lifecycleMonitor, () => import("./lifecycle-monitor.worker").then(m => m.run()));

  console.log("[Workers] All schedules registered.", WORKER_SCHEDULES);
  console.log("[Workers] Running. Press Ctrl+C to exit.");
}

bootstrap().catch((err) => {
  console.error("[Workers] Fatal bootstrap error:", err);
  process.exit(1);
});
