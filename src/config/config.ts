/**
 * @public
 */
export type CompressionAlgorithm = "gzip" | "brotli";

/**
 * @public
 */
export interface ArtifactConfig {
	/** Unique identifier for this artifact */
	id: string;
	/** The name of this artifact (displayed in the resulting reports) */
	name: string;
	/** Files to include for this artifact (globs supported) */
	include?: string | string[];
	/** Files to exclude for this artifact (globs supported) */
	exclude?: string | string[];

	/**
	 * Enabled compression algorithms for this artifact.
	 *
	 * Accepts:
	 * - an array of algorithms (e.g. `["gzip"]`)
	 * - a single algorithm as a string (e.g. `"gzip"`)
	 * - `false` to explicitly disable compression (same as an empty array)
	 *
	 * When omitted the default is `["gzip", "brotli"]`.
	 */
	compression?: CompressionAlgorithm | CompressionAlgorithm[] | false;
}

/**
 * @public
 */
export interface Config {
	/** Build artifacts to analyze. */
	artifacts?: ArtifactConfig[];
}
