import nodefs from "node:fs/promises";
import { Ajv } from "ajv";
import schema from "../schema.json" with { type: "json" };
import { type Config, type NormalizedConfig, normalizeConfig } from "./config/index.ts";
import { readJsonFile } from "./read-json-file.ts";

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema as object);

/**
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

	const bundles = config.bundles ?? [];
	const seen = new Set<string>();
	for (const bundle of bundles) {
		if (seen.has(bundle.id)) {
			throw new Error(`Duplicate bundle id "${bundle.id}" found in config`);
		}
		seen.add(bundle.id);
	}
	return normalizeConfig(config);
}
