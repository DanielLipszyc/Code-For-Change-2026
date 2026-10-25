import SavedReportsList from "./_components/SavedReportsList";

/** /drafts: reports saved on this device, waiting to be finished or sent */
export default function DraftsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <SavedReportsList />
      </section>
    </div>
  );
}
