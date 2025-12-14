import type { ArtifactDiff } from "../artifact-diff.ts";
import type { ArtifactSize } from "../artifact-size.ts";
import { compareArtifact } from "./compare-artifact.ts";

type OneOf<T> =
	| { base: T; current: T }
	| { base: undefined; current: T }
	| { base: T; current: undefined };

/**
 * Compare two arrays of `ArtifactSize`, calculating the diff between each artifact.
 *
 * Artifacts are matched by `id`. Returns diffs for artifacts that are added,
 * removed, or updated.
 *
 * @public
 */
export function compareArtifacts(base: ArtifactSize[], current: ArtifactSize[]): ArtifactDiff[] {
	const baseMap = new Map(base.map((b) => [b.id, b]));
	const currentMap = new Map(current.map((b) => [b.id, b]));

	// Preserve order: base ids first, then any current-only ids in current order.
	const ids = Array.from(new Set([...base.map((b) => b.id), ...current.map((b) => b.id)]));

	function getArtifactsById(id: string): OneOf<ArtifactSize> {
		/* need to cast here to satisfy TypeScript that one of the properties is defined */
		return { base: baseMap.get(id), current: currentMap.get(id) } as OneOf<ArtifactSize>;
	}

	return ids.map((id) => {
		const { base, current } = getArtifactsById(id);
		if (current && base) {
			return compareArtifact(base, current);
		} else if (current) {
			return compareArtifact(undefined, current);
		} else {
			return compareArtifact(base, undefined);
		}
	});
}
