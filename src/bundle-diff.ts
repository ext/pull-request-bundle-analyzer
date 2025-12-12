import type { FileResult } from "./file-result.ts";

/**
 * Grouped sizes for a single compression/state.
 *
 * @public
 */
export interface BundleDiffSize {
	/** New size */
	newSize: number;
	/** Old size */
	oldSize: number;
	/** Difference (new - old) */
	difference: number;
}

/**
 * Result of comparing two bundle size results.
 *
 * @public
 */
export interface BundleDiff {
	/** Unique identifier for this bundle */
	id: string;
	/** Bundle name */
	name: string;
	/** Status of the bundle when comparing base vs current */
	status: "added" | "removed" | "updated";

	/** Uncompressed / raw sizes */
	raw: BundleDiffSize;

	/** Gzip compressed sizes */
	gzip: BundleDiffSize;

	/** Brotli compressed sizes */
	brotli: BundleDiffSize;

	/** Files from the base result */
	oldFiles: FileResult[];

	/** Files from the current bundle */
	newFiles: FileResult[];
}
