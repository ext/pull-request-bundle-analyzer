import { type ArtifactDiff, type ArtifactSizeDiff } from "../artifact-diff.ts";
import { type ArtifactSize } from "../artifact-size.ts";

function compareUpdated(base: ArtifactSize, current: ArtifactSize): ArtifactDiff {
	const raw: ArtifactSizeDiff = {
		oldSize: base.size,
		newSize: current.size,
		difference: current.size - base.size,
	};
	let gzip: ArtifactSizeDiff | null;
	if (base.gzip === null || current.gzip === null) {
		gzip = null;
	} else {
		gzip = {
			oldSize: base.gzip,
			newSize: current.gzip,
			difference: current.gzip - base.gzip,
		};
	}

	let brotli: ArtifactSizeDiff | null;
	if (base.brotli === null || current.brotli === null) {
		brotli = null;
	} else {
		brotli = {
			oldSize: base.brotli,
			newSize: current.brotli,
			difference: current.brotli - base.brotli,
		};
	}
	return {
		status: "updated",
		id: current.id,
		name: current.artifact,
		raw,
		gzip,
		brotli,
		oldFiles: base.files,
		newFiles: current.files,
	};
}

function compareAdded(current: ArtifactSize): ArtifactDiff {
	const raw: ArtifactSizeDiff = {
		oldSize: 0,
		newSize: current.size,
		difference: current.size,
	};
	let gzip: ArtifactSizeDiff | null;
	if (current.gzip === null) {
		gzip = null;
	} else {
		gzip = {
			oldSize: 0,
			newSize: current.gzip,
			difference: current.gzip,
		};
	}

	let brotli: ArtifactSizeDiff | null;
	if (current.brotli === null) {
		brotli = null;
	} else {
		brotli = {
			oldSize: 0,
			newSize: current.brotli,
			difference: current.brotli,
		};
	}
	return {
		status: "added",
		id: current.id,
		name: current.artifact,
		raw,
		gzip,
		brotli,
		oldFiles: [],
		newFiles: current.files,
	};
}

function compareRemoved(base: ArtifactSize): ArtifactDiff {
	const raw: ArtifactSizeDiff = {
		oldSize: base.size,
		newSize: 0,
		difference: -base.size,
	};
	let gzip: ArtifactSizeDiff | null;
	if (base.gzip === null) {
		gzip = null;
	} else {
		gzip = {
			oldSize: base.gzip,
			newSize: 0,
			difference: -base.gzip,
		};
	}

	let brotli: ArtifactSizeDiff | null;
	if (base.brotli === null) {
		brotli = null;
	} else {
		brotli = {
			oldSize: base.brotli,
			newSize: 0,
			difference: -base.brotli,
		};
	}
	return {
		status: "removed",
		id: base.id,
		name: base.artifact,
		raw,
		gzip,
		brotli,
		oldFiles: base.files,
		newFiles: [],
	};
}

/* eslint-disable @typescript-eslint/unified-signatures -- false positive */

/**
 * Compare two artifacts and return the size difference.
 *
 * The returned values are computed as `current - base` for each metric. The
 * returned object also contains the `files` array copied from the `current`
 * result so callers can inspect per-file sizes if needed.
 *
 * @public
 */
export function compareArtifact(base: ArtifactSize, current: ArtifactSize): ArtifactDiff;

/**
 * Compare two artifacts and return the size difference.
 *
 * The returned values are computed as `current - base` for each metric. The
 * returned object also contains the `files` array copied from the `current`
 * result so callers can inspect per-file sizes if needed.
 *
 * @public
 */

export function compareArtifact(base: ArtifactSize, current: undefined): ArtifactDiff;

/**
 * Compare two artifacts and return the size difference.
 *
 * The returned values are computed as `current - base` for each metric. The
 * returned object also contains the `files` array copied from the `current`
 * result so callers can inspect per-file sizes if needed.
 *
 * @public
 */

export function compareArtifact(base: undefined, current: ArtifactSize): ArtifactDiff;

/* eslint-enable @typescript-eslint/unified-signatures */
export function compareArtifact(
	...args: [ArtifactSize, ArtifactSize] | [undefined, ArtifactSize] | [ArtifactSize, undefined]
): ArtifactDiff {
	const [base, current] = args;

	if (base && current) {
		return compareUpdated(base, current);
	} else if (current) {
		return compareAdded(current);
	} else {
		return compareRemoved(base);
	}
}
