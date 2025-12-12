import type { FileResult } from "./file-result.ts";

/**
 * Sizes for a single bundle.
 *
 * @public
 */
export interface BundleSize {
	/** Unique identifier for this bundle */
	id: string;
	/** Bundle name */
	bundle: string;
	/** Files in the bundle (detailed per-file sizes) */
	files: FileResult[];
	/** Size on disk (bytes) */
	size: number;
	/** Gzip compressed size (bytes) or null if algorithm is disabled */
	gzip: number | null;
	/** Brotli compressed size (bytes) or null if algorithm is disabled */
	brotli: number | null;
}
