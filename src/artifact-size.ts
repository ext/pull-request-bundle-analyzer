import { type FileResult } from "./file-result.ts";

/**
 * Sizes for a single artifact.
 *
 * @public
 */
export interface ArtifactSize {
	/** Unique identifier for this artifact */
	id: string;
	/** Artifact name */
	artifact: string;
	/** Files in the artifact (detailed per-file sizes) */
	files: FileResult[];
	/** Size on disk (bytes) */
	size: number;
	/** Gzip compressed size (bytes) or null if algorithm is disabled */
	gzip: number | null;
	/** Brotli compressed size (bytes) or null if algorithm is disabled */
	brotli: number | null;
}
