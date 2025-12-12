import type { BundleDiff, BundleDiffSize } from "../bundle-diff.ts";
import type { BundleSize } from "../bundle-size.ts";

function compareUpdated(base: BundleSize, current: BundleSize): BundleDiff {
	const raw: BundleDiffSize = {
		oldSize: base.size,
		newSize: current.size,
		difference: current.size - base.size,
	};
	const gzip: BundleDiffSize = {
		oldSize: base.gzip,
		newSize: current.gzip,
		difference: current.gzip - base.gzip,
	};
	const brotli: BundleDiffSize = {
		oldSize: base.brotli,
		newSize: current.brotli,
		difference: current.brotli - base.brotli,
	};
	return {
		status: "updated",
		id: current.id,
		name: current.bundle,
		raw,
		gzip,
		brotli,
		oldFiles: base.files,
		newFiles: current.files,
	};
}

function compareAdded(current: BundleSize): BundleDiff {
	const raw: BundleDiffSize = {
		oldSize: 0,
		newSize: current.size,
		difference: current.size,
	};
	const gzip: BundleDiffSize = {
		oldSize: 0,
		newSize: current.gzip,
		difference: current.gzip,
	};
	const brotli: BundleDiffSize = {
		oldSize: 0,
		newSize: current.brotli,
		difference: current.brotli,
	};
	return {
		status: "added",
		id: current.id,
		name: current.bundle,
		raw,
		gzip,
		brotli,
		oldFiles: [],
		newFiles: current.files,
	};
}

function compareRemoved(base: BundleSize): BundleDiff {
	const raw: BundleDiffSize = {
		oldSize: base.size,
		newSize: 0,
		difference: -base.size,
	};
	const gzip: BundleDiffSize = {
		oldSize: base.gzip,
		newSize: 0,
		difference: -base.gzip,
	};
	const brotli: BundleDiffSize = {
		oldSize: base.brotli,
		newSize: 0,
		difference: -base.brotli,
	};
	return {
		status: "removed",
		id: base.id,
		name: base.bundle,
		raw,
		gzip,
		brotli,
		oldFiles: base.files,
		newFiles: [],
	};
}

/**
 * Compare two bundles and return the size difference.
 *
 * The returned values are computed as `current - base` for each metric. The
 * returned object also contains the `files` array copied from the `current`
 * result so callers can inspect per-file sizes if needed.
 *
 * @internal
 */
/* eslint-disable @typescript-eslint/unified-signatures -- false positive */
export function compareBundle(base: BundleSize, current: BundleSize): BundleDiff;
export function compareBundle(base: BundleSize, current: undefined): BundleDiff;
export function compareBundle(base: undefined, current: BundleSize): BundleDiff;
/* eslint-enable @typescript-eslint/unified-signatures */
export function compareBundle(
	...args: [BundleSize, BundleSize] | [undefined, BundleSize] | [BundleSize, undefined]
): BundleDiff {
	const [base, current] = args;

	if (base && current) {
		return compareUpdated(base, current);
	} else if (current) {
		return compareAdded(current);
	} else {
		return compareRemoved(base);
	}
}
