import { type ArtifactConfig, type CompressionAlgorithm, type Config } from "./config.ts";
import { type NormalizedConfig } from "./index.ts";

function toArray<T>(value: T | T[] | undefined): T[] {
	if (Array.isArray(value)) {
		return value;
	}
	return value ? [value] : [];
}

function normalizeCompression(value: ArtifactConfig["compression"]): CompressionAlgorithm[] {
	if (value === undefined) {
		return ["gzip", "brotli"];
	}
	if (value === false) {
		return [];
	}
	return toArray(value);
}

/**
 * @internal
 */
export function normalizeConfig(config: Config): NormalizedConfig {
	const { artifacts = [] } = config;
	return {
		artifacts: artifacts.map((entry) => {
			return {
				id: entry.id,
				name: entry.name,
				include: toArray(entry.include),
				exclude: toArray(entry.exclude),
				compression: normalizeCompression(entry.compression),
			};
		}),
	};
}
