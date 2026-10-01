"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Shown when a page in this group fails to load, e.g. the database is unreachable */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">⚠️</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-slate-600">
          This page couldn&apos;t load right now. Please try again in a moment.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-[#136207] px-5 py-3 text-sm font-bold text-white hover:bg-[#0f5006]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
