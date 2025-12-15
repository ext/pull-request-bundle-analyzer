import nodefs from "node:fs/promises";
import yargs from "yargs";
import { createAnalyzeCommand } from "./analyze.ts";
import { createCompareCommand } from "./compare.ts";

/**
 * @internal
 */
export interface CliOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	argv: string[];
	console?: Console;
	fs?: typeof nodefs;
}

/**
 * @internal
 */
export interface CreateParserOptions {
	cwd: string;
	env: NodeJS.ProcessEnv;
	console: Console;
	fs: typeof nodefs;
}

/**
 * @internal
 */
export function createParser(options: CreateParserOptions): ReturnType<typeof yargs> {
	const { cwd, env, console, fs } = options;
	return yargs()
		.scriptName("artifact-size-analyzer")
		.usage("$0 <command> [options]")
		.parserConfiguration({
			"boolean-negation": false,
		})
		.command(createAnalyzeCommand({ cwd, env, console, fs }))
		.command(createCompareCommand({ cwd, env, console, fs }))
		.demandCommand(1, "Please specify a command: analyze or compare")
		.strict()
		.help();
}

/**
 * @internal
 */
/* istanbul ignore next */
/* v8 ignore next -- @preserve createParser covers this */
export async function cli(options: CliOptions): Promise<void> {
	const { argv, console = globalThis.console, cwd, env, fs = nodefs } = options;
	const parser = createParser({ cwd, env, console, fs });
	await parser.parseAsync(argv);
}
