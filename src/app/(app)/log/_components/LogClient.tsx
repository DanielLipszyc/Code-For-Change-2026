"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import type { Submission, SubmissionStatus } from "@/types/submission";
import SubmissionCard from "./SubmissionCard";

/** Search, filter and manage the signed-in user's submissions */
export default function LogClient({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { language, t } = useLanguage();
  const locale = language === "pt" ? "pt-BR" : language;

  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SubmissionStatus>("All");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions
      .filter((s) => {
        const matchesStatus = statusFilter === "All" || s.status === statusFilter;
        const matchesQuery =
          !q ||
          s.plantName.toLowerCase().includes(q) ||
          s.scientificName?.toLowerCase().includes(q) ||
          s.notes?.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [submissions, query, statusFilter]);

  async function handleDelete(submission: Submission) {
    const confirmed = await confirm({
      title: t("Delete this report?"),
      message: t("{plant}, submitted {date}. This can't be undone.", {
        plant: submission.plantName,
        date: new Date(submission.createdAt).toLocaleDateString(locale),
      }),
      confirmLabel: t("Delete"),
      danger: true,
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/submissions/${submission.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || t("Failed to delete submission"));
      }
      setSubmissions((current) => current.filter((s) => s.id !== submission.id));
      toast.success(t("Report deleted."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Failed to delete submission"));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              {t("My Submission Log")}
            </h1>
            <p className="mt-2 text-slate-600">{t("View and manage all your plant submissions")}</p>
          </div>

          <div className="grid w-full gap-3 sm:w-auto sm:min-w-[420px]">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search your submissions...")}
                aria-label={t("Search your submissions")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "All" | SubmissionStatus)}
              aria-label={t("Filter by status")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="All">{t("All statuses")}</option>
              <option value="approved">{t("Approved")}</option>
              <option value="pending">{t("Pending")}</option>
            </select>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-slate-600">
            {t(shown.length === 1 ? "Showing {count} submission" : "Showing {count} submissions", {
              count: shown.length,
            })}
          </p>

          {shown.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">
              {query || statusFilter !== "All" ? (
                <>
                  <div className="mb-4 text-4xl">🔍</div>
                  <p className="mb-2 font-semibold">{t("No matches found")}</p>
                  <p className="text-sm text-slate-600">
                    {t("Try adjusting your search or filter")}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-4 text-4xl">🌱</div>
                  <p className="mb-2 font-semibold">{t("No submissions yet")}</p>
                  <p className="mb-4 text-sm text-slate-600">
                    {t("Start contributing by submitting your first plant sighting!")}
                  </p>
                  <Link
                    href="/submit"
                    className="inline-block rounded-lg bg-[#136207] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#0f5006]"
                  >
                    {t("Submit a Plant")}
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
