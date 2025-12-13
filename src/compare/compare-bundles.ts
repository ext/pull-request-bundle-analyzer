import type { BundleDiff } from "../bundle-diff.ts";
import type { BundleSize } from "../bundle-size.ts";
import { compareBundle } from "./compare-bundle.ts";

type OneOf<T> =
	| { base: T; current: T }
	| { base: undefined; current: T }
	| { base: T; current: undefined };

/**
 * Compare two arrays of `BundleSize`, calculating the diff between each bundle.
 *
 * Bundles are matched by `id`. Returns diffs for bundles that are added,
 * removed, or updated.
 *
 * @public
 */
export function compareBundles(base: BundleSize[], current: BundleSize[]): BundleDiff[] {
	const baseMap = new Map(base.map((b) => [b.id, b]));
	const currentMap = new Map(current.map((b) => [b.id, b]));

	// Preserve order: base ids first, then any current-only ids in current order.
	const ids = Array.from(new Set([...base.map((b) => b.id), ...current.map((b) => b.id)]));

	function getBundlesById(id: string): OneOf<BundleSize> {
		/* need to cast here to satisfy TypeScript that one of the properties is defined */
		return { base: baseMap.get(id), current: currentMap.get(id) } as OneOf<BundleSize>;
	}

	return ids.map((id) => {
		const { base, current } = getBundlesById(id);
		if (current && base) {
			return compareBundle(base, current);
		} else if (current) {
			return compareBundle(undefined, current);
		} else {
			return compareBundle(base, undefined);
		}
	});
}
