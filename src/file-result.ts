/**
 * Per-file size result.
 *
 * @public
 */
export interface FileResult {
	/** Filename (relative to working directory) */
	filename: string;
	/** Size in bytes */
	size: number;
	/** Gzip size in bytes or null if algorithm is disabled */
	gzip: number | null;
	/** Brotli size in bytes or null if algorithm is disabled */
	brotli: number | null;
}
