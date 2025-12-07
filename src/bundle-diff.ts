import type { FileResult } from "./file-result.ts";

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

	/** Old size */
	oldSize: number;
	/** New size */
	newSize: number;
	/** Difference in size (new - old) */
	sizeDiff: number;

	/** Old gzip */
	oldGzip: number;
	/** New gzip */
	newGzip: number;
	/** Difference in gzip (new - old) */
	gzipDiff: number;

	/** Old brotli */
	oldBrotli: number;
	/** New brotli */
	newBrotli: number;
	/** Difference in brotli (new - old) */
	brotliDiff: number;

	/** Files from the base result */
	oldFiles: FileResult[];

	/** Files from the current bundle */
	newFiles: FileResult[];
}
