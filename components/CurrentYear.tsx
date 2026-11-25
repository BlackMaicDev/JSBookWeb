"use client";

import { useSyncExternalStore } from "react";

function subscribe(notify: () => void) {
  const interval = window.setInterval(notify, 60_000);
  return () => window.clearInterval(interval);
}

function currentYear() {
  return String(new Date().getFullYear());
}

function serverYear() {
  return "";
}

export default function CurrentYear() {
  return useSyncExternalStore(subscribe, currentYear, serverYear);
}
