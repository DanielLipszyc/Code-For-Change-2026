import SavedReportsList from "./_components/SavedReportsList";

/** /drafts: reports saved on this device, waiting to be finished or sent */
export default function DraftsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Drafts</h1>
          <p className="mt-2 text-gray-600">
            Reports saved on this device. Finished ones are sent automatically once you&apos;re
            online; drafts wait for you to finish them.
          </p>
        </div>
        <SavedReportsList />
      </section>
    </div>
  );
}
