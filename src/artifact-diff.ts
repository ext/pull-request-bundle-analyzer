import type { FileResult } from "./file-result.ts";

/**
 * Grouped sizes for a single compression/state.
 *
 * @public
 */
export interface ArtifactSizeDiff {
	/** New size */
	newSize: number;
	/** Old size */
	oldSize: number;
	/** Difference (new - old) */
	difference: number;
}

/**
 * Result of comparing two artifact size results.
 *
 * @public
 */
export interface ArtifactDiff {
	/** Unique identifier for this artifact */
	id: string;
	/** Artifact name */
	name: string;
	/** Status of the artifact when comparing base vs current */
	status: "added" | "removed" | "updated";

	/** Uncompressed / raw sizes */
	raw: ArtifactSizeDiff;

	/** Gzip compressed sizes or null if algorithm is disabled */
	gzip: ArtifactSizeDiff | null;

	/** Brotli compressed sizes or null if algorithm is disabled */
	brotli: ArtifactSizeDiff | null;

	/** Files from the base result */
	oldFiles: FileResult[];

	/** Files from the current artifact */
	newFiles: FileResult[];
}
