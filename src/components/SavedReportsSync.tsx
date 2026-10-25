"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/Toast";
import { sendQueuedReports } from "@/client/offline/send";

/**
 * Sends reports saved on this device while offline, as soon as there's a
 * connection: when a page opens, when the browser comes back online, and
 * when the tab comes back into view. Mounted once, in the root layout.
 *
 * Also asks the service worker (app/sw.ts) to keep the submit and drafts
 * pages, so they open in the field without a signal.
 */
export default function SavedReportsSync() {
  const { isLoaded, user } = useUser();
  const userId = user?.id ?? null;
  const toast = useToast();

  useEffect(() => {
    // Who's signed in decides which reports may be sent, so wait for sign-in to load
    if (!isLoaded) return;

    const sendNow = async () => {
      if (!navigator.onLine) return;
      const { sent } = await sendQueuedReports(userId).catch(() => ({ sent: 0 }));
      if (sent) toast.success(`Sent ${sent} saved report${sent === 1 ? "" : "s"}.`);
    };
    const onVisible = () => document.visibilityState === "visible" && sendNow();

    sendNow();
    window.addEventListener("online", sendNow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", sendNow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isLoaded, userId, toast]);

  useEffect(() => {
    if (!userId || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((registration) => registration.active?.postMessage({ type: "CACHE_SIGNED_IN_PAGES" }))
      .catch(() => {});
  }, [userId]);

  return null;
}
