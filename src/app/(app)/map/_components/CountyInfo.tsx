/** Static facts shown under the map (rendered on the server) */
export default function CountyInfo() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          About Alachua County
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Alachua County is located in north-central Florida and is home to diverse wetland
          ecosystems and plant species. The county encompasses approximately 1,400 square miles and
          includes the city of Gainesville.
        </p>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li>• Area: ~1,400 square miles</li>
          <li>• County Seat: Gainesville</li>
          <li>• Population: ~280,000</li>
          <li>• Key Wetlands: Paynes Prairie, Newnans Lake</li>
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Native Plants</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Alachua County is rich in native plant species adapted to its subtropical climate and
          wetland environments.
        </p>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li>• Sawgrass</li>
          <li>• Bald Cypress</li>
          <li>• Water Lilies</li>
          <li>• Pickerelweed</li>
        </ul>
      </div>
    </div>
  );
}
