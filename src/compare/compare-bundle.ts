import type { BundleDiff } from "../bundle-diff.ts";
import type { BundleSize } from "../bundle-size.ts";

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
		return {
			status: "updated",
			id: current.id,
			name: current.bundle,
			oldSize: base.size,
			newSize: current.size,
			sizeDiff: current.size - base.size,

			oldGzip: base.gzip,
			newGzip: current.gzip,
			gzipDiff: current.gzip - base.gzip,

			oldBrotli: base.brotli,
			newBrotli: current.brotli,
			brotliDiff: current.brotli - base.brotli,

			oldFiles: base.files,
			newFiles: current.files,
		};
	} else if (current) {
		return {
			status: "added",
			id: current.id,
			name: current.bundle,
			oldSize: 0,
			newSize: current.size,
			sizeDiff: current.size,

			oldGzip: 0,
			newGzip: current.gzip,
			gzipDiff: current.gzip,

			oldBrotli: 0,
			newBrotli: current.brotli,
			brotliDiff: current.brotli,

			oldFiles: [],
			newFiles: current.files,
		};
	} else {
		return {
			status: "removed",
			id: base.id,
			name: base.bundle,
			oldSize: base.size,
			newSize: 0,
			sizeDiff: -base.size,

			oldGzip: base.gzip,
			newGzip: 0,
			gzipDiff: -base.gzip,

			oldBrotli: base.brotli,
			newBrotli: 0,
			brotliDiff: -base.brotli,

			oldFiles: base.files,
			newFiles: [],
		};
	}
}
