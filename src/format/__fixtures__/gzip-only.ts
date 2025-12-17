/**
 * Gzip-only compression fixture - artifacts with only gzip compression enabled.
 * Used for testing single compression algorithm scenarios.
 */

import { type ArtifactDiff } from "../../artifact-diff.ts";

export const gzipOnly: ArtifactDiff[] = [
	{
		id: "one-a",
		name: "one-a",
		status: "updated",
		raw: { oldSize: 90, newSize: 100, difference: 10 },
		gzip: { oldSize: 75, newSize: 80, difference: 5 },
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
	{
		id: "one-b",
		name: "one-b",
		status: "updated",
		raw: { oldSize: 50, newSize: 60, difference: 10 },
		gzip: { oldSize: 40, newSize: 45, difference: 5 },
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
];
