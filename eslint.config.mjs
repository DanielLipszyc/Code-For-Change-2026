import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
	baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
	{
		ignores: ["coverage/**", ".next/**", "node_modules/**", "playwright-report/**", "test-results/**"],
	},
	...compat.extends("next/core-web-vitals"),
	{
		rules: {
			"react-hooks/set-state-in-effect": "off",
		},
	},
];

export default eslintConfig;