import nodefs from "node:fs/promises";
import { Ajv } from "ajv";
import schema from "../schema.json" with { type: "json" };
import { type Config, type NormalizedConfig, normalizeConfig } from "./config/index.ts";
import { readJsonFile } from "./utils/index.ts";

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema as object);

/**
 * Read, validate and normalize config file.
 *
 * @public
 * @param filePath - Path to config file
 * @param fs - Optional fs promises-like API to use (for testing)
 * @returns Parsed and normalized config
 */
export async function readConfigFile(
	filePath: string,
	fs: typeof nodefs = nodefs,
): Promise<NormalizedConfig> {
	const config = (await readJsonFile(filePath, fs)) as Config;

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
