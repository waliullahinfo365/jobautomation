import type { CorsOptions } from "cors";
import { env } from "./env";

const devOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  env.appUrl,
].filter(Boolean) as string[]);

/** Production: `APP_URL` only. Development: localhost + `APP_URL`. */
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (env.nodeEnv !== "production") {
      if (!origin || devOrigins.has(origin)) return callback(null, true);
      return callback(null, false);
    }
    if (!origin) return callback(null, true);
    if (origin === env.appUrl) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
};
