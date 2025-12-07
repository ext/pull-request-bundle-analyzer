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

function toArray<T>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : [value];
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
	outputFile?: string | undefined;
	outputGithub: ParsedOutput[];
	console?: Console;
	fs?: typeof nodefs;
}

interface CompareOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	format: Format;
	outputFile?: string | undefined;
	outputGithub: ParsedOutput[];
	base: string;
	current: string;
	console?: Console;
	fs?: typeof nodefs;
}

interface WriteOutputOptions {
	cwd: string;
	output: string;
	outputFile?: string | undefined;
	fs: typeof nodefs;
	console: Console;
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
						describe: "Write output to file instead of stdout",
						type: "string",
						requiresArg: true,
					})
					.option("output-github", {
						describe: "Write output to a GitHub Actions output (format:key)",
						type: "string",
						array: true,
						requiresArg: true,
						hidden: true,
						default: [],
						coerce(value) {
							return toArray(value).map(parseOutput);
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
					outputFile: args.outputFile,
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
						describe: "Write output to file instead of stdout",
						type: "string",
						requiresArg: true,
					})
					.option("output-github", {
						describe: "Write output to a GitHub Actions output (format:key)",
						type: "string",
						array: true,
						requiresArg: true,
						hidden: true,
						default: [],
						coerce(value) {
							return toArray(value).map(parseOutput);
						},
					}),
			async (args) => {
				await compare({
					cwd,
					env,
					base: args.base,
					current: args.current,
					format: args.format,
					outputFile: args.outputFile,
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
	const color = options.outputFile ? false : process.stdout.isTTY;
	const output = formatBundle(results, options.format, { color });

	await writeOutput({
		fs,
		cwd: options.cwd,
		output,
		outputFile: options.outputFile,
		console: options.console ?? console,
	});

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
	const color = options.outputFile ? false : process.stdout.isTTY;
	const basePath = resolve(options.cwd, options.base);
	const currentPath = resolve(options.cwd, options.current);
	const base = (await readJsonFile(basePath, options.fs)) as BundleSize[];
	const current = (await readJsonFile(currentPath, options.fs)) as BundleSize[];
	const diff = compareBundles(base, current);
	const output = formatDiff(diff, options.format, { color });

	await writeOutput({
		fs,
		cwd: options.cwd,
		output,
		outputFile: options.outputFile,
		console: options.console ?? console,
	});

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

async function writeOutput({
	fs,
	cwd,
	output,
	outputFile,
	console,
}: WriteOutputOptions): Promise<void> {
	if (outputFile) {
		const outPath = resolve(cwd, outputFile);
		await fs.writeFile(outPath, output, "utf8");
	} else {
		console.log(output);
	}
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
