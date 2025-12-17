/**
 * Mixed compression algorithms fixture - artifacts with different compression settings.
 * Used for testing scenarios where compression algorithms vary across artifacts.
 */

import { type ArtifactDiff } from "../../artifact-diff.ts";

export const mixedCompression: ArtifactDiff[] = [
	{
		id: "all-enabled",
		name: "all-enabled",
		status: "updated",
		raw: { oldSize: 120, newSize: 130, difference: 10 },
		gzip: { oldSize: 90, newSize: 95, difference: 5 },
		brotli: { oldSize: 80, newSize: 85, difference: 5 },
		oldFiles: [],
		newFiles: [],
	},
	{
		id: "brotli-only",
		name: "brotli-only",
		status: "updated",
		raw: { oldSize: 70, newSize: 75, difference: 5 },
		gzip: null,
		brotli: { oldSize: 60, newSize: 62, difference: 2 },
		oldFiles: [],
		newFiles: [],
	},
	{
		id: "all-disabled",
		name: "all-disabled",
		status: "updated",
		raw: { oldSize: 30, newSize: 40, difference: 10 },
		gzip: null,
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
];
