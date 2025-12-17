import type nodefs from "node:fs/promises";
import { type CommandModule } from "yargs";
import { type ArtifactSize } from "../artifact-size.ts";
import { compareArtifacts } from "../compare/index.ts";
import { type Format, formatDiff, formats } from "../format/index.ts";
import {
	type ParsedOutput,
	type ParsedOutputMaybeFormat,
	parseOutput,
	readJsonFile,
	resolve,
	toArray,
	writeFile,
	writeGithub,
} from "../utils/index.ts";

/**
 * @internal
 */
export interface CompareOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	format: Format;
	outputFile: ParsedOutput[];
	outputGithub: ParsedOutput[];
	base: string;
	current: string;
	formatOptions: { header: boolean; unchanged: "show" | "hide" | "collapse" };
	console: Console;
	fs: typeof nodefs;
}

/**
 * @internal
 */
export async function compare(options: CompareOptions): Promise<void> {
	const { console, cwd, env, fs, formatOptions } = options;
	const basePath = resolve(cwd, options.base);
	const currentPath = resolve(cwd, options.current);
	const base = await readJsonFile<ArtifactSize[]>(basePath, { fs });
	const current = await readJsonFile<ArtifactSize[]>(currentPath, { fs });
	const diff = compareArtifacts(base, current);

	if (options.outputFile.length > 0) {
		for (const spec of options.outputFile) {
			const { format, key: filename } = spec;
			const output = formatDiff(diff, format, { color: false, ...formatOptions });
			await writeFile(output, { fs, cwd, filename });
		}
	} else {
		const color = process.stdout.isTTY;
		const output = formatDiff(diff, options.format, { color, ...formatOptions });
		console.log(output);
	}

	for (const spec of options.outputGithub) {
		const { format: fmt, key } = spec;
		const output = formatDiff(diff, fmt, { color: false, ...formatOptions });
		await writeGithub(output, { fs, env, key });
	}
}

/**
 * @internal
 */
export interface CompareCommandFactoryOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	console: Console;
	fs: typeof nodefs;
}

/**
 * @internal
 */
export function createCompareCommand(options: CompareCommandFactoryOptions): CommandModule {
	const { cwd, env, console, fs } = options;

	return {
		command: "compare",
		describe: "Compare two previously saved analysis results",
		builder(yargs) {
			return yargs
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
				.option("unchanged", {
					describe:
						"Control how artifacts with unchanged sizes are handled. 'show' displays all artifacts, 'hide' omits unchanged ones, 'collapse' shows them in a collapsible section",
					type: "string",
					choices: ["show", "hide", "collapse"],
					default: "show",
				})
				.option("no-unchanged", {
					describe:
						"Hide artifacts with unchanged sizes from output (equivalent to --unchanged=hide)",
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
				});
		},
		async handler(args) {
			let unchanged = args["unchanged"] as "show" | "hide" | "collapse";
			if (args["no-unchanged"]) {
				unchanged = "hide";
			}

			await compare({
				cwd,
				env,
				base: args["base"] as string,
				current: args["current"] as string,
				format: args["format"] as Format,
				formatOptions: {
					header: !args["no-header"],
					unchanged,
				},
				outputFile: (args["output-file"] as ParsedOutputMaybeFormat[]).map((it) => ({
					format: it.format ?? (args["format"] as Format),
					key: it.key,
				})),
				outputGithub: args["output-github"] as ParsedOutput[],
				console,
				fs,
			});
		},
	};
}
