/* This file is managed by @html-validate/eslint-config */
/* Changes may be overwritten */

import path from "node:path";
import { fileURLToPath } from "node:url";
import defaultConfig from "@html-validate/eslint-config";
import typescriptConfig from "@html-validate/eslint-config-typescript";
import typescriptTypeinfoConfig from "@html-validate/eslint-config-typescript-typeinfo";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default [
	{
		name: "Ignored files",
		ignores: [
			"**/coverage/**",
			"**/dist/**",
			"**/node_modules/**",
			"**/out/**",
			"**/public/assets/**",
			"**/temp/**",
		],
	},

	...defaultConfig,

	{
		name: "@html-validate/eslint-config-typescript",
		files: ["**/*.{ts,cts,mts}"],
		...typescriptConfig,
	},

	{
		name: "@html-validate/eslint-config-typeinfo",
		files: ["src/**/*.ts"],
		ignores: ["src/**/*.spec.ts"],
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: rootDir,
				projectService: true,
			},
		},
		...typescriptTypeinfoConfig,
	},

	{
		name: "local/ts",
		files: ["**/*.ts"],
		rules: {
			"import/extensions": "off",
		},
	},

	{
		name: "local/examples",
		files: ["examples/**/*.ts"],
		rules: {
			"no-console": "off",
			"import/no-unresolved": "off",
		},
	},
];
