"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px)";

function subscribeMatchMedia(query: string, onStoreChange: () => void) {
  const mq = window.matchMedia(query);
  // Safari < 14 uses addListener/removeListener
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onStoreChange);
    return () => mq.removeEventListener("change", onStoreChange);
  }
  const legacy = mq as MediaQueryList & {
    addListener?: (listener: () => void) => void;
    removeListener?: (listener: () => void) => void;
  };
  legacy.addListener?.(onStoreChange);
  return () => legacy.removeListener?.(onStoreChange);
}

function subscribe(onStoreChange: () => void) {
  return subscribeMatchMedia(QUERY, onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useMatchMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => subscribeMatchMedia(query, onChange),
    () => window.matchMedia(query).matches,
    () => false
  );
}
