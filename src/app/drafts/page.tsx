"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { offlineStorage, OfflineDraft } from "@/lib/offlineStorage";

export default function DraftsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, [user]);

  const loadDrafts = async () => {
    setLoading(true);
    const userDrafts = await offlineStorage.getDrafts(user?.id);
    setDrafts(userDrafts);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft?")) return;

    await offlineStorage.deleteDraft(id);
    await loadDrafts();
  };

  const handleComplete = (draft: OfflineDraft) => {
    const params = new URLSearchParams();
    params.set("draftId", draft.id);
    router.push(`/submit?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-600">Loading drafts...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Drafts</h1>
          <p className="mt-2 text-gray-600">
            Complete and submit your saved offline observations
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/offline-submit")}
            className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            New Offline Draft
          </button>
          <button
            onClick={() => router.push("/submit")}
            className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Online Submit
          </button>
        </div>

        {drafts.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No drafts yet</h2>
            <p className="text-gray-600 mb-6">
              Use offline mode to save location and photo for later.
            </p>
            <button
              onClick={() => router.push("/offline-submit")}
              className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Create First Draft
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">
                        {new Date(draft.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Location: {draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}</p>
                      {draft.imageData && <p>Photo attached</p>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleComplete(draft)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
