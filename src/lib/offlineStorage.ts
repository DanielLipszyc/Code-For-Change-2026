export interface OfflineDraft {
  id: string;
  lat: number;
  lng: number;
  locationAccuracyM?: number;
  imageData: string;
  timestamp: number;
  userId?: string;
  createdAt: number;
}

const DB_NAME = "swamp-spotter-offline";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

export const offlineStorage = {
  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("userId", "userId", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  },

  async saveDraft(draft: Omit<OfflineDraft, "id" | "createdAt">): Promise<string> {
    const db = await this.init();
    const id = crypto.randomUUID();
    const draftWithId: OfflineDraft = {
      ...draft,
      id,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(draftWithId);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  },

  async getDrafts(userId?: string): Promise<OfflineDraft[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const drafts = request.result;
        if (userId) {
          resolve(drafts.filter((d) => !d.userId || d.userId === userId));
        } else {
          resolve(drafts);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getDraft(id: string): Promise<OfflineDraft | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteDraft(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async updateDraft(id: string, updates: Partial<OfflineDraft>): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const draft = getReq.result;
        if (draft) {
          const updated = { ...draft, ...updates };
          const putReq = store.put(updated);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          reject(new Error("Draft not found"));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  },
};
