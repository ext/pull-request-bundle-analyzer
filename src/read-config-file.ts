import nodefs from "node:fs/promises";
import { Ajv } from "ajv";
import schema from "../schema.json" with { type: "json" };
import { type Config, type NormalizedConfig, normalizeConfig } from "./config/index.ts";
import { readJsonFile } from "./utils/index.ts";

/**
 * Options for `readConfigFile`.
 *
 * @public
 */
export interface ReadConfigFileOptions {
	/* Optional fs promises-like API to use */
	fs?: typeof nodefs | undefined;
}

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema as object);

/**
 * Read, validate and normalize config file.
 *
 * @public
 * @param filePath - Path to config file
 * @param options - Optional options
 * @returns Parsed and normalized config
 */
export async function readConfigFile(
	filePath: string,
	options: ReadConfigFileOptions = {},
): Promise<NormalizedConfig> {
	const { fs = nodefs } = options;
	const config = await readJsonFile<Config>(filePath, { fs });

	if (!validate(config)) {
		const errText = ajv.errorsText(validate.errors, { separator: "\n" });
		throw new Error(`Config schema validation failed: ${errText}`);
	}

	const artifacts = config.artifacts ?? [];
	const seen = new Set<string>();
	for (const artifact of artifacts) {
		if (seen.has(artifact.id)) {
			throw new Error(`Duplicate artifact id "${artifact.id}" found in config`);
		}
		seen.add(artifact.id);
	}
	return normalizeConfig(config);
}
