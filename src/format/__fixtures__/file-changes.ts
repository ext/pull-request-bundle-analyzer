/**
 * File changes fixture - artifact with removed files but still exists.
 * Used for testing scenarios where individual files are added or removed within an artifact.
 */

import { type ArtifactDiff } from "../../artifact-diff.ts";

export const fileChanges: ArtifactDiff[] = [
	{
		id: "removed-files",
		name: "removed-files",
		status: "updated",
		raw: { oldSize: 120, newSize: 110, difference: -10 },
		gzip: null,
		brotli: null,
		oldFiles: [
			{ filename: "dist/a.js", size: 60, gzip: null, brotli: null },
			{ filename: "dist/b.js", size: 60, gzip: null, brotli: null },
		],
		newFiles: [{ filename: "dist/a.js", size: 110, gzip: null, brotli: null }],
	},
];
