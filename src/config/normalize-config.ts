import { type Config, type NormalizedConfig } from "./index.ts";

function toArray(value: string | string[] | undefined): string[] {
	if (Array.isArray(value)) {
		return value;
	}
	return value ? [value] : [];
}

/**
 * @internal
 */
export function normalizeConfig(config: Config): NormalizedConfig {
	const { bundles = [] } = config;
	return {
		bundles: bundles.map((entry) => {
			return {
				id: entry.id,
				name: entry.name,
				include: toArray(entry.include),
				exclude: toArray(entry.exclude),
			};
		}),
	};
}
