"use client";

import { useEffect } from "react";

/** Registers the service worker for web push + PWA. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => void 0);
  }, []);

  return null;
}
