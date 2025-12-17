/**
 * No compression fixture - artifacts with all compression algorithms disabled.
 * Used for testing scenarios where compression is not available.
 */

import { type ArtifactDiff } from "../../artifact-diff.ts";

export const noCompression: ArtifactDiff[] = [
	{
		id: "none-a",
		name: "none-a",
		status: "updated",
		raw: { oldSize: 90, newSize: 100, difference: 10 },
		gzip: null,
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
	{
		id: "none-b",
		name: "none-b",
		status: "updated",
		raw: { oldSize: 50, newSize: 60, difference: 10 },
		gzip: null,
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
];

export const singleAddedNoCompression: ArtifactDiff[] = [
	{
		id: "new-nc",
		name: "new-nc",
		status: "added",
		raw: { oldSize: 0, newSize: 150, difference: 150 },
		gzip: null,
		brotli: null,
		oldFiles: [],
		newFiles: [{ filename: "dist/new-nc.js", size: 150, gzip: null, brotli: null }],
	},
];

export const singleRemovedNoCompression: ArtifactDiff[] = [
	{
		id: "old-nc",
		name: "old-nc",
		status: "removed",
		raw: { oldSize: 200, newSize: 0, difference: -200 },
		gzip: null,
		brotli: null,
		oldFiles: [{ filename: "dist/old-nc.js", size: 200, gzip: null, brotli: null }],
		newFiles: [],
	},
];
