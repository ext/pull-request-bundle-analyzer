import type nodefs from "node:fs/promises";
import { type CommandModule } from "yargs";
import { analyzeArtifact } from "../analyze-artifact.ts";
import { readConfigFile } from "../config/index.ts";
import { type Format, formatArtifact, formats } from "../format/index.ts";
import { type ParsedOutput, type ParsedOutputMaybeFormat, parseOutput } from "../utils/index.ts";
import { resolve } from "../utils/resolve.ts";
import { toArray } from "../utils/to-array.ts";
import { writeFile } from "../utils/write-file.ts";
import { writeGithub } from "../utils/write-github.ts";
import { UserError } from "./user-error.ts";

/**
 * @internal
 */
export interface AnalyzeOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	configFile: string;
	format: Format;
	outputFile: ParsedOutput[];
	outputGithub: ParsedOutput[];
	formatOptions: { header: boolean };
	console: Console;
	fs: typeof nodefs;
}

/**
 * @internal
 */
export async function analyze(options: AnalyzeOptions): Promise<void> {
	const { console, cwd, env, fs, formatOptions } = options;
	const { header } = formatOptions;
	const configPath = resolve(cwd, options.configFile);
	const config = await readConfigFile(configPath, { fs });
	const results = await Promise.all(
		config.artifacts.map((artifact) => {
			const compression = {
				gzip: artifact.compression.includes("gzip"),
				brotli: artifact.compression.includes("brotli"),
			};
			return analyzeArtifact(artifact, { cwd, fs, compression });
		}),
	);

	if (options.outputFile.length > 0) {
		for (const spec of options.outputFile) {
			const { format, key: filename } = spec;
			const output = formatArtifact(results, format, { header });
			await writeFile(output, { fs, cwd, filename });
		}
	} else {
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

/**
 * @internal
 */
export interface AnalyzeCommandFactoryOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	console: Console;
	fs: typeof nodefs;
}

/**
 * @internal
 */
export function createAnalyzeCommand(options: AnalyzeCommandFactoryOptions): CommandModule {
	const { cwd, env, console, fs } = options;

	return {
		command: "analyze",
		describe: "Analyze artifacts from a config file",
		builder(yargs) {
			return yargs
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
				});
		},
		async handler(args) {
			const configFile = args["config-file"] as string;
			const configPath = resolve(cwd, configFile);

			/* ensure config file exists before running analyze */
			try {
				await fs.access(configPath);
			} catch {
				throw new UserError({
					message: `Configuration file not found: "${configFile}". Please check the \`--config-file\` path.`,
					code: "ENOCONFIG",
				});
			}

			await analyze({
				cwd,
				env,
				configFile,
				format: args["format"] as Format,
				formatOptions: { header: !args["no-header"] },
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
