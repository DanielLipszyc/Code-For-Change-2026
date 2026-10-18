type NetworkStatusCallback = (isOnline: boolean) => void;

class NetworkStatusManager {
  private callbacks: Set<NetworkStatusCallback> = new Set();
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyCallbacks();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyCallbacks();
  };

  private notifyCallbacks() {
    this.callbacks.forEach((callback) => callback(this.isOnline));
  }

  subscribe(callback: NetworkStatusCallback): () => void {
    this.callbacks.add(callback);
    callback(this.isOnline);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const networkStatus = new NetworkStatusManager();
