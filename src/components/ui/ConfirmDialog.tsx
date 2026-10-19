"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Dialog } from "./Dialog";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** Style the confirm button as destructive */
  danger?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/** Provides useConfirm(). Mounted once, in the root layout. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<
    (ConfirmOptions & { resolve: (confirmed: boolean) => void }) | null
  >(null);

  const confirm = useCallback<Confirm>(
    (options) => new Promise((resolve) => setRequest({ ...options, resolve })),
    [],
  );

  const settle = (confirmed: boolean) => {
    request?.resolve(confirmed);
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={request !== null}
        onClose={() => settle(false)}
        title={request?.title ?? ""}
        role="alertdialog"
      >
        {request?.message && <p className="px-6 pt-2 text-sm text-slate-600">{request.message}</p>}
        <div className="flex justify-end gap-3 px-6 py-5">
          {/* Cancel comes first, so it has focus when the dialog opens */}
          <button
            type="button"
            onClick={() => settle(false)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => settle(true)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              request?.danger ? "bg-red-600 hover:bg-red-700" : "bg-[#136207] hover:bg-[#0f5006]"
            }`}
          >
            {request?.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

/**
 * Ask the user to confirm an action; resolves true if they do.
 *   if (await confirm({ title: "Delete this report?", danger: true })) ...
 */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}
