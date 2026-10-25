"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useOnline, useSavedReports } from "@/client/offline/hooks";
import { canSendAs, deleteSavedReport, type SavedReport } from "@/client/offline/reports";
import { sendQueuedReports, sendSavedReport } from "@/client/offline/send";
import { useLanguage } from "@/components/LanguageProvider";

function statusOf(
  report: SavedReport,
  online: boolean,
  userId: string | null,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (report.status === "draft") {
    return { label: t("Draft"), detail: t("Finish it to send it."), tone: "slate" as const };
  }
  if (report.lastError && !report.lastError.retry) {
    return { label: t("Needs changes"), detail: report.lastError.message, tone: "red" as const };
  }
  if (!canSendAs(report, userId)) {
    return { label: t("Waiting"), detail: t("Sign in to send it."), tone: "amber" as const };
  }
  if (report.lastError) {
    return {
      label: t("Waiting to send"),
      detail: t("Couldn't send yet ({message}). It will try again.", {
        message: report.lastError.message,
      }),
      tone: "amber" as const,
    };
  }
  return online
    ? { label: t("Waiting to send"), detail: t("Sending shortly."), tone: "green" as const }
    : {
        label: t("Waiting for a connection"),
        detail: t("It will be sent automatically when you're back online."),
        tone: "amber" as const,
      };
}

const TONES = {
  slate: "bg-slate-100 text-slate-700",
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-900",
  green: "bg-green-100 text-green-800",
};

/** Reports saved on this device: drafts to finish and reports waiting to be sent */
export default function SavedReportsList() {
  const reports = useSavedReports();
  const online = useOnline();
  const { user } = useUser();
  const userId = user?.id ?? null;
  const toast = useToast();
  const confirm = useConfirm();
  const { language, t } = useLanguage();
  const locale = language === "pt" ? "pt-BR" : language;
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleSend(report: SavedReport) {
    setSendingId(report.id);
    const result = await sendSavedReport(report);
    setSendingId(null);
    if (result.status === "sent") toast.success(t("Report sent."));
    else if (result.status === "offline")
      toast.error(t("Still no connection. It will be sent later."));
    else toast.error(result.error);
  }

  async function handleSendAll() {
    setSendingId("all");
    const { sent, failed } = await sendQueuedReports(userId);
    setSendingId(null);
    if (sent) {
      toast.success(
        t(sent === 1 ? "Sent {count} report." : "Sent {count} reports.", { count: sent }),
      );
    }
    if (failed) {
      toast.error(
        t(failed === 1 ? "{count} report couldn't be sent." : "{count} reports couldn't be sent.", {
          count: failed,
        }),
      );
    }
    if (!sent && !failed) toast.error(t("Couldn't connect. They'll be sent later."));
  }

  async function handleDelete(report: SavedReport) {
    const confirmed = await confirm({
      title: report.status === "draft" ? t("Delete this draft?") : t("Delete this report?"),
      message: t("It's only saved on this device, so it can't be recovered."),
      confirmLabel: t("Delete"),
      danger: true,
    });
    if (confirmed) await deleteSavedReport(report.id);
  }

  if (reports === null) {
    return <p className="text-gray-600">{t("Loading…")}</p>;
  }

  const sendable = reports.filter(
    (r) => r.status === "queued" && (r.lastError?.retry ?? true) && canSendAs(r, userId),
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("My Drafts")}</h1>
        <p className="mt-2 text-gray-600">
          {t(
            "Reports saved on this device. Finished ones are sent automatically once you're online; drafts wait for you to finish them.",
          )}
        </p>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/submit"
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          {t("New report")}
        </Link>
        {online && sendable.length > 0 && (
          <button
            type="button"
            onClick={handleSendAll}
            disabled={sendingId !== null}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {sendingId === "all"
              ? t("Sending…")
              : t("Send {count} now", { count: sendable.length })}
          </button>
        )}
        <span
          className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
            online ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"
          }`}
          role="status"
        >
          {online ? t("Online") : t("Offline")}
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-12 text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t("Nothing saved")}</h2>
          <p className="text-gray-600">
            {t(
              "Reports you save as drafts, or make without a connection, wait here until they're sent.",
            )}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => {
            const status = statusOf(report, online, userId, t);
            return (
              <li key={report.id} className="flex gap-4 rounded-lg border border-gray-200 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- a photo saved on the device (data URL) */}
                <img
                  src={report.photo}
                  alt=""
                  className="h-20 w-20 flex-shrink-0 rounded-md bg-gray-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">
                      {report.plantName ?? t("No plant chosen yet")}
                    </h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONES[status.tone]}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{status.detail}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("Spotted {date} at {coordinates}", {
                      date: new Date(report.observedAt).toLocaleString(locale),
                      coordinates: `${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`,
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/submit?draft=${report.id}`}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-green-700"
                  >
                    {report.status === "draft" ? t("Finish") : t("Edit")}
                  </Link>
                  {report.status === "queued" && online && canSendAs(report, userId) && (
                    <button
                      type="button"
                      onClick={() => handleSend(report)}
                      disabled={sendingId !== null}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      {sendingId === report.id ? t("Sending…") : t("Send now")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(report)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    {t("Delete")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
