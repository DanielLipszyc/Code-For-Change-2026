import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  {
    ignores: [
      ".next/",
      "node_modules/",
      "coverage/",
      "next-env.d.ts",
      "services/",
      "public/sw.js",
      "public/swe-worker-*.js",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
