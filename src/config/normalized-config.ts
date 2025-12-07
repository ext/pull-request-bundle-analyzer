/**
 * @public
 */
export interface NormalizedBundleConfig {
	/** Unique identifier for this bundle */
	id: string;
	name: string;
	include: string[];
	exclude: string[];
}

/**
 * @public
 */
export interface NormalizedConfig {
	bundles: NormalizedBundleConfig[];
}
