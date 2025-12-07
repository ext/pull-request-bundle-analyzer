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
export function compareBundle(base: BundleSize, current: BundleSize): BundleDiff {
	return {
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
}
