import { type ArtifactSizeDiff } from "../artifact-diff.ts";

/**
 * @internal
 */
export function formatPercent({ oldSize, newSize, difference }: ArtifactSizeDiff): string {
	if (oldSize === 0) {
		return "+0.00%";
	}

	if (oldSize === newSize) {
		return "-";
	}

	const pct = ((difference / oldSize) * 100).toFixed(2);
	return difference >= 0 ? `+${pct}%` : `${pct}%`;
}
