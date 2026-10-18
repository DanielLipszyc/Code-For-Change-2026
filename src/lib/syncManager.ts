import { offlineStorage, OfflineDraft } from "./offlineStorage";

export interface SyncResult {
  id: string;
  success: boolean;
  error?: string;
}

export const syncManager = {
  async syncDraft(draft: OfflineDraft, plantName: string, notes?: string): Promise<SyncResult> {
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantName: plantName || "Unknown",
          lat: draft.lat,
          lng: draft.lng,
          locationAccuracyM: draft.locationAccuracyM,
          timestamp: draft.timestamp,
          notes: notes,
          imageData: draft.imageData,
          userId: draft.userId,
          anonymous: !draft.userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await offlineStorage.deleteDraft(draft.id);
      return { id: draft.id, success: true };
    } catch (error: any) {
      return { id: draft.id, success: false, error: error.message };
    }
  },
};
