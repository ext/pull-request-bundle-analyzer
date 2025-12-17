/**
 * Single added artifact fixture - represents a newly added artifact.
 * Used for testing add scenarios across all output formats.
 */

import { type ArtifactDiff } from "../../artifact-diff.ts";

export const singleAdded: ArtifactDiff[] = [
	{
		id: "new",
		name: "new",
		status: "added",
		raw: { oldSize: 0, newSize: 150, difference: 150 },
		gzip: { oldSize: 0, newSize: 100, difference: 100 },
		brotli: { oldSize: 0, newSize: 80, difference: 80 },
		oldFiles: [],
		newFiles: [{ filename: "dist/new.js", size: 150, gzip: 100, brotli: 80 }],
	},
];
