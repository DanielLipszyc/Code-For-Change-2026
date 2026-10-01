import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Tests run server code directly, so resolve "server-only" to its empty
      // module the way Next.js does on the server
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Placeholders so server modules can be imported. Tests mock every outside
    // service, so these values are never used to connect to anything.
    env: {
      SUPABASE_URL: "http://localhost:54321",
      SUPABASE_SECRET_KEY: "test-secret-key",
    },
  },
});
