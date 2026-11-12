"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function SuggestSpeciesPage() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setSuccess(false);
    try {
      const response = await fetch("/api/species-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scientificName, description, imageUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t("Unable to submit"));
      setSuccess(true);
      setMessage(
        t("Species suggested! An administrator will review it before it appears in the guide."),
      );
      setName("");
      setScientificName("");
      setDescription("");
      setImageUrl("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("Unable to submit"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/guide" className="text-sm font-semibold text-emerald-700">
        ← {t("Back to guide")}
      </Link>
      <h1 className="mt-5 text-3xl font-bold text-slate-900">{t("Suggest a new species")}</h1>
      <p className="mt-2 text-slate-600">
        {t(
          "Can\'t find a plant in the guide? Suggest it for administrative review. Sign-in is required; submissions are not published automatically.",
        )}
      </p>
      <form
        onSubmit={submit}
        className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block text-sm font-semibold text-slate-800">
          {t("Common name")}
          <input
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-800">
          {t("Scientific name")}
          <input
            required
            minLength={3}
            maxLength={160}
            value={scientificName}
            onChange={(e) => setScientificName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-800">
          {t("Identification details and reason for inclusion")}
          <textarea
            required
            minLength={20}
            maxLength={3000}
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t(
              "Describe leaves, flowers, fruit, growth habit, and where you observed it.",
            )}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-800">
          {t("Reference image URL (optional)")}
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          />
        </label>
        <button
          disabled={busy}
          type="submit"
          className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? t("Submitting…") : t("Submit for review")}
        </button>
        {message && (
          <p role="status" className={success ? "text-emerald-700" : "text-rose-700"}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
