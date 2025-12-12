/**
 * @public
 */
export interface NormalizedBundleConfig {
	/** Unique identifier for this bundle */
	id: string;
	name: string;
	include: string[];
	exclude: string[];
	/** Enabled compression algorithms for this bundle */
	compression: Array<"gzip" | "brotli">;
}

/**
 * @public
 */
export interface NormalizedConfig {
	bundles: NormalizedBundleConfig[];
}
