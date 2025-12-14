import { type ArtifactDiff } from "../artifact-diff.ts";

export function jsonFormat(results: ArtifactDiff[]): string {
	return JSON.stringify(results, null, 2);
}
