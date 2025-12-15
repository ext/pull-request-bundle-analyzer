import nodefs from "node:fs/promises";
import yargs from "yargs";
import { analyzeArtifact } from "./analyze-artifact.ts";
import { type ArtifactSize } from "./artifact-size.ts";
import { compareArtifacts } from "./compare/index.ts";
import { type Format, formatArtifact, formatDiff, formats } from "./format/index.ts";
import { readConfigFile } from "./read-config-file.ts";
import {
	type ParsedOutput,
	parseOutput,
	readJsonFile,
	resolve,
	toArray,
	writeFile,
	writeGithub,
} from "./utils/index.ts";

interface CliOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	argv: string[];
}

interface AnalyzeOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	configFile: string;
	format: Format;
	outputFile: ParsedOutput[];
	outputGithub: ParsedOutput[];
	formatOptions: { header: boolean };
	console?: Console;
	fs?: typeof nodefs;
}

interface CompareOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	format: Format;
	outputFile: ParsedOutput[];
	outputGithub: ParsedOutput[];
	base: string;
	current: string;
	formatOptions: { header: boolean };
	console?: Console;
	fs?: typeof nodefs;
}

export async function cli(options: CliOptions): Promise<void> {
	const { cwd, env, argv } = options;
	const parser = yargs(argv)
		.scriptName("artifact-size-analyzer")
		.usage("$0 <command> [options]")
		.parserConfiguration({
			"boolean-negation": false,
		})
		.command(
			"analyze",
			"Analyze artifacts from a config file",
			(y) =>
				y
					.option("config-file", {
						alias: "c",
						describe: "Configuration file",
						demandOption: true,
						type: "string",
						requiresArg: true,
					})
					.option("output-file", {
						alias: "o",
						describe: "Write output to file instead of stdout (format:filename or filename)",
						type: "string",
						array: true,
						default: [],
						requiresArg: true,
						coerce(value) {
							return toArray(value, (it) =>
								parseOutput(it, { paramName: "--output-file", requireFormat: false }),
							);
						},
					})
					.option("output-github", {
						describe: "Write output to a GitHub Actions output (format:key)",
						type: "string",
						array: true,
						requiresArg: true,
						hidden: true,
						default: [],
						coerce(value) {
							return toArray(value, (it) =>
								parseOutput(it, { paramName: "--output-github", requireFormat: true }),
							);
						},
					})
					.option("format", {
						alias: "f",
						describe: "Output format",
						choices: formats,
						default: "text" as const,
					})
					.option("no-header", {
						describe: "Disable header in output for formats with headers",
						type: "boolean",
						default: false,
					}),
			async (args) => {
				await analyze({
					cwd,
					env,
					configFile: args.configFile,
					format: args.format,
					formatOptions: { header: !args.noHeader },
					outputFile: args.outputFile.map((it) => ({
						format: it.format ?? args.format,
						key: it.key,
					})),
					outputGithub: args.outputGithub,
				});
			},
		)
		.command(
			"compare",
			"Compare two previously saved analysis results",
			(y) =>
				y
					.option("base", {
						alias: "b",
						describe: "Path to baseline JSON file",
						type: "string",
						requiresArg: true,
						demandOption: true,
					})
					.option("current", {
						alias: "c",
						describe: "Path to current JSON file",
						type: "string",
						requiresArg: true,
						demandOption: true,
					})
					.option("format", {
						alias: "f",
						describe: "Output format",
						choices: formats,
						default: "text" as const,
					})
					.option("no-header", {
						describe: "Disable header in output for formats with headers",
						type: "boolean",
						default: false,
					})
					.option("output-file", {
						alias: "o",
						describe: "Write output to file instead of stdout (format:filename or filename)",
						type: "string",
						array: true,
						default: [],
						requiresArg: true,
						coerce(value) {
							return toArray(value, (it) =>
								parseOutput(it, { paramName: "--output-file", requireFormat: false }),
							);
						},
					})
					.option("output-github", {
						describe: "Write output to a GitHub Actions output (format:key)",
						type: "string",
						array: true,
						requiresArg: true,
						hidden: true,
						default: [],
						coerce(value) {
							return toArray(value, (it) =>
								parseOutput(it, { paramName: "--output-github", requireFormat: true }),
							);
						},
					}),
			async (args) => {
				await compare({
					cwd,
					env,
					base: args.base,
					current: args.current,
					format: args.format,
					formatOptions: { header: !args.noHeader },
					outputFile: args.outputFile.map((it) => ({
						format: it.format ?? args.format,
						key: it.key,
					})),
					outputGithub: args.outputGithub,
				});
			},
		)
		.demandCommand(1, "Please specify a command: analyze or compare")
		.strict()
		.help();

	await parser.parse();
}

export async function analyze(options: AnalyzeOptions): Promise<void> {
	const { cwd, env, fs = nodefs, formatOptions } = options;
	const { header } = formatOptions;
	const configPath = resolve(options.cwd, options.configFile);
	const config = await readConfigFile(configPath, { fs });
	const results = await Promise.all(
		config.artifacts.map((artifact) => {
			const compression = {
				gzip: artifact.compression.includes("gzip"),
				brotli: artifact.compression.includes("brotli"),
			};
			return analyzeArtifact(artifact, {
				cwd: options.cwd,
				fs: options.fs,
				compression,
			});
		}),
	);

	if (options.outputFile.length > 0) {
		for (const spec of options.outputFile) {
			const { format, key: filename } = spec;
			const output = formatArtifact(results, format, { header });
			await writeFile(output, { fs, cwd, filename });
		}
	} else {
		const console = options.console ?? globalThis.console;
		const color = process.stdout.isTTY;
		const output = formatArtifact(results, options.format, { color, header });
		console.log(output);
	}

	for (const spec of options.outputGithub) {
		const { format: fmt, key } = spec;
		const output = formatArtifact(results, fmt, { header });
		await writeGithub(output, { fs, env, key });
	}
}

export async function compare(options: CompareOptions): Promise<void> {
	const { cwd, env, fs = nodefs, formatOptions } = options;
	const { header } = formatOptions;
	const basePath = resolve(options.cwd, options.base);
	const currentPath = resolve(options.cwd, options.current);
	const base = await readJsonFile<ArtifactSize[]>(basePath, { fs });
	const current = await readJsonFile<ArtifactSize[]>(currentPath, { fs });
	const diff = compareArtifacts(base, current);

	if (options.outputFile.length > 0) {
		for (const spec of options.outputFile) {
			const { format, key: filename } = spec;
			const output = formatDiff(diff, format, { header });
			await writeFile(output, { fs, cwd, filename });
		}
	} else {
		const console = options.console ?? globalThis.console;
		const color = process.stdout.isTTY;
		const output = formatDiff(diff, options.format, { color, header });
		console.log(output);
	}

	for (const spec of options.outputGithub) {
		const { format: fmt, key } = spec;
		const output = formatDiff(diff, fmt, { header });
		await writeGithub(output, { fs, env, key });
	}
}
