/**
 * @public
 */
export type CompressionAlgorithm = "gzip" | "brotli";

/**
 * @public
 */
export interface BundleConfig {
	/** Unique identifier for this bundle */
	id: string;
	/** The name of this bundle (displayed in the resulting reports) */
	name: string;
	/** Files to include for this bundle (globs supported) */
	include?: string | string[];
	/** Files to exclude for this bundle (globs supported) */
	exclude?: string | string[];

	/**
	 * Enabled compression algorithms for this bundle.
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
	bundles?: BundleConfig[];
}
