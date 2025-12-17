/**
 * Single removed artifact fixture - represents a removed artifact.
 * Used for testing removal scenarios across all output formats.
 */

import { type ArtifactDiff } from "../../artifact-diff.ts";

export const singleRemoved: ArtifactDiff[] = [
	{
		id: "old",
		name: "old",
		status: "removed",
		raw: { oldSize: 200, newSize: 0, difference: -200 },
		gzip: { oldSize: 120, newSize: 0, difference: -120 },
		brotli: { oldSize: 80, newSize: 0, difference: -80 },
		oldFiles: [{ filename: "dist/old.js", size: 200, gzip: 120, brotli: 80 }],
		newFiles: [],
	},
];
