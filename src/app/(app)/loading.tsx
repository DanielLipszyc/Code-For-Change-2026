/** Shown while a page in this group loads its data on the server */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#136207]" />
        <p className="mt-4 text-slate-600">Loading…</p>
      </div>
    </div>
  );
}
