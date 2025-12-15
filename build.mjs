import fs from "node:fs/promises";
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";
import esbuild from "esbuild";
import isCI from "is-ci";

async function readJsonFile(path) {
	const content = await fs.readFile(path, "utf8");
	return JSON.parse(content);
}

const { external = [] } = await readJsonFile(new URL("./package.json", import.meta.url));

async function build() {
	const result = await esbuild.build({
		entryPoints: ["src/index.ts", { in: "src/cli/cli.ts", out: "cli" }],
		bundle: true,
		metafile: true,
		splitting: true,
		platform: "node",
		format: "esm",
		outdir: "dist",
		sourcemap: true,
		target: ["node22"],
		external,
		logLevel: "info",
		outExtension: {
			".js": ".mjs",
		},
	});
	console.log(await esbuild.analyzeMetafile(result.metafile));
}

async function apiExtractor() {
	const filename = `api-extractor.json`;
	const config = ExtractorConfig.loadFileAndPrepare(filename);
	const result = Extractor.invoke(config, {
		localBuild: !isCI,
		showVerboseMessages: true,
	});
	if (result.succeeded) {
		console.log(`API Extractor completed successfully`);
	} else {
		const { errorCount, warningCount } = result;
		console.error(
			[
				"API Extractor completed with",
				`${errorCount} error(s) and ${warningCount} warning(s)`,
			].join("\n"),
		);
		process.exitCode = 1;
	}
	console.groupEnd();
}

await fs.rm("dist", { recursive: true, force: true });
await build();
await apiExtractor();
