import { type ArtifactDiff } from "../artifact-diff.ts";

/**
 * Filters out unchanged artifacts when unchanged is set to hide or collapse.
 *
 * @internal
 * @param artifacts - The list of artifact diffs
 * @param unchanged - How to handle unchanged artifacts
 * @returns Filtered array of artifacts
 */
export function filterUnchangedArtifacts(
	artifacts: ArtifactDiff[],
	unchanged: "show" | "hide" | "collapse",
): ArtifactDiff[] {
	if (unchanged === "show") {
		return artifacts;
	}

	return artifacts.filter((artifact) => {
		return artifact.status !== "updated" || artifact.raw.difference !== 0;
	});
}
