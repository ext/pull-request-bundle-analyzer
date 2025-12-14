/**
 * @public
 */
export interface NormalizedArtifactConfig {
	/** Unique identifier for this artifact */
	id: string;
	name: string;
	include: string[];
	exclude: string[];
	/** Enabled compression algorithms for this artifact */
	compression: Array<"gzip" | "brotli">;
}

/**
 * @public
 */
export interface NormalizedConfig {
	artifacts: NormalizedArtifactConfig[];
}
