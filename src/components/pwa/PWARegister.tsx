"use client";

import { useEffect } from "react";

import { isPwaLocalMode } from "@/lib/pwa-mode";

export function PWARegister() {
  useEffect(() => {
    if (!isPwaLocalMode || !("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
}

