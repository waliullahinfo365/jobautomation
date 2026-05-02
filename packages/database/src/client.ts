import mongoose from "mongoose";
declare global { var __jobflow_mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined; }
const cached = global.__jobflow_mongoose ?? { conn: null, promise: null };
if (!global.__jobflow_mongoose) global.__jobflow_mongoose = cached;
export async function connectDatabase() { const uri = process.env.MONGODB_URI; if (!uri) throw new Error("MONGODB_URI is not set"); if (cached.conn) return cached.conn; if (!cached.promise) cached.promise = mongoose.connect(uri, { bufferCommands: false }); cached.conn = await cached.promise; return cached.conn; }
export async function disconnectDatabase() { if (mongoose.connection.readyState !== 0) await mongoose.disconnect(); cached.conn = null; cached.promise = null; }
export function getDatabaseStatus() {
  const stateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return {
    readyState: mongoose.connection.readyState,
    state: stateMap[mongoose.connection.readyState] ?? "unknown",
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}
