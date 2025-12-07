import type { BundleDiff } from "../bundle-diff.ts";
import type { BundleSize } from "../bundle-size.ts";
import { compareBundle } from "./compare-bundle.ts";

function zip<A, B>(a: A[], b: B[]): Array<[A, B, number]> {
	return a.map((_, i) => [a[i], b[i], i]);
}

/**
 * Compare two arrays of `BundleSize`, calculating the diff between each bundle.
 *
 * The arrays are expected to be the same length and contain bundles in the same
 * order.
 *
 * @public
 */
export function compareBundles(base: BundleSize[], current: BundleSize[]): BundleDiff[] {
	if (base.length !== current.length) {
		throw new Error("Bundle arrays have different lengths");
	}
	return zip(base, current).map(([a, b, index]) => {
		if (a.bundle !== b.bundle) {
			throw new Error(
				`Bundle name mismatch at index ${String(index)}: ${a.bundle} !== ${b.bundle}`,
			);
		}
		if (a.id !== b.id) {
			throw new Error(`Bundle id mismatch at index ${String(index)}: ${a.id} !== ${b.id}`);
		}
		return compareBundle(a, b);
	});
}
