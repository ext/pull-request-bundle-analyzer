import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		coverage: {
			provider: "v8",
			reporter: ["text", "text-summary", "lcov"],
			include: ["src/**/*.[jt]s"],
			exclude: ["src/cli.ts", "src/**/index.ts", "src/**/__fixtures__/**"],
		},
	},
});
