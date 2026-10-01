import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
	{
		ignores: ["coverage/**", ".next/**", "node_modules/**", "playwright-report/**", "test-results/**"],
	},
	...nextVitals,
	{
		rules: {
			"react-hooks/set-state-in-effect": "off",
		},
	},
];

export default eslintConfig;