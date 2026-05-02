"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/config/env";

type Status = "connected" | "mock" | "offline";

export function ApiStatusIndicator({ usingMock }: { usingMock?: boolean }) {
  const [status, setStatus] = useState<Status>(usingMock ? "mock" : "offline");

  useEffect(() => {
    if (usingMock) {
      setStatus("mock");
      return;
    }
    let mounted = true;
    fetch(`${API_URL}/health`)
      .then((res) => {
        if (!mounted) return;
        setStatus(res.ok ? "connected" : "offline");
      })
      .catch(() => {
        if (!mounted) return;
        setStatus("offline");
      });
    return () => {
      mounted = false;
    };
  }, [usingMock]);

  const copy =
    status === "connected"
      ? { text: "API Connected", className: "bg-emerald-100 text-emerald-700" }
      : status === "mock"
        ? { text: "Using Mock Data", className: "bg-amber-100 text-amber-700" }
        : { text: "API Offline", className: "bg-rose-100 text-rose-700" };

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${copy.className}`}>{copy.text}</span>;
}
