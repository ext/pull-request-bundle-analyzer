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
}

/**
 * @public
 */
export interface Config {
	bundles?: BundleConfig[];
}
