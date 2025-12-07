import nodefs from "node:fs/promises";
import path from "node:path";
import yargs from "yargs";
import { type BundleSize } from "./bundle-size.ts";
import { compareBundles } from "./compare/index.ts";
import { type Format, formatBundle, formatDiff, formats } from "./format/index.ts";
import { getBundleSize } from "./get-bundle-size.ts";
import { readConfigFile } from "./read-config-file.ts";
import { readJsonFile } from "./read-json-file.ts";
import { type ParsedOutput, parseOutput } from "./utils/index.ts";

function resolve(cwd: string, p: string): string {
	return path.isAbsolute(p) ? p : path.join(cwd, p);
}

function toArray<T>(value: T | T[]): T[];
function toArray<T, U>(value: T | T[], transform: (v: T) => U): U[];
function toArray<T, U>(value: T | T[], transform?: (v: T) => U): T[] | U[] {
	const arr = Array.isArray(value) ? value : [value];
	if (transform) {
		return arr.map(transform);
	}
	return arr;
}

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
	console?: Console;
	fs?: typeof nodefs;
}

interface WriteFileOptions {
	cwd: string;
	filename: string;
	output: string;
	fs: typeof nodefs;
}

interface WriteGithubOptions {
	env: NodeJS.ProcessEnv;
	key: string;
	output: string;
	fs: typeof nodefs;
}

export async function cli(options: CliOptions): Promise<void> {
	const { cwd, env, argv } = options;
	const parser = yargs(argv)
		.scriptName("bundle-analyzer")
		.usage("$0 <command> [options]")
		.command(
			"analyze",
			"Analyze bundles from a config file",
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
					}),
			async (args) => {
				await analyze({
					cwd,
					env,
					configFile: args.configFile,
					format: args.format,
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
	const fs = options.fs ?? nodefs;
	const configPath = resolve(options.cwd, options.configFile);
	const config = await readConfigFile(configPath, options.fs);
	const results = await Promise.all(
		config.bundles.map((bundle) => getBundleSize(bundle, { cwd: options.cwd, fs: options.fs })),
	);

	if (options.outputFile.length > 0) {
		for (const spec of options.outputFile) {
			const { format, key } = spec;
			const output = formatBundle(results, format, { color: false });
			await writeFile({
				fs,
				cwd: options.cwd,
				filename: key,
				output,
			});
		}
	} else {
		const console = options.console ?? globalThis.console;
		const color = process.stdout.isTTY;
		const output = formatBundle(results, options.format, { color });
		console.log(output);
	}

	for (const spec of options.outputGithub) {
		const { format: fmt, key } = spec;
		const output = formatBundle(results, fmt, { color: false });
		await writeGithub({
			fs,
			env: options.env,
			key,
			output,
		});
	}
}

export async function compare(options: CompareOptions): Promise<void> {
	const fs = options.fs ?? nodefs;
	const basePath = resolve(options.cwd, options.base);
	const currentPath = resolve(options.cwd, options.current);
	const base = (await readJsonFile(basePath, options.fs)) as BundleSize[];
	const current = (await readJsonFile(currentPath, options.fs)) as BundleSize[];
	const diff = compareBundles(base, current);

	if (options.outputFile.length > 0) {
		for (const spec of options.outputFile) {
			const { format, key } = spec;
			const output = formatDiff(diff, format, { color: false });
			await writeFile({
				fs,
				cwd: options.cwd,
				filename: key,
				output,
			});
		}
	} else {
		const console = options.console ?? globalThis.console;
		const color = process.stdout.isTTY;
		const output = formatDiff(diff, options.format, { color });
		console.log(output);
	}

	for (const spec of options.outputGithub) {
		const { format: fmt, key } = spec;
		const output = formatDiff(diff, fmt, { color: false });
		await writeGithub({
			fs,
			env: options.env,
			key,
			output,
		});
	}
}

async function writeFile({ fs, cwd, output, filename }: WriteFileOptions): Promise<void> {
	const dst = resolve(cwd, filename);
	await fs.writeFile(dst, output, "utf8");
}

async function writeGithub({ fs, env, key, output }: WriteGithubOptions): Promise<void> {
	const dst = env["GITHUB_OUTPUT"];
	if (!dst) {
		return;
	}

	const value = output.replace(/\r/g, "");
	const payload = `${key}<<EOF\n${value}\nEOF\n`;
	await fs.appendFile(dst, payload, "utf8");
}
