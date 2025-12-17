/**
 * Mixed artifact changes fixture - contains artifacts with increases, decreases, and no changes.
 * Used for testing the standard formatting scenarios across all output formats.
 */

import { type ArtifactDiff } from "../../artifact-diff.ts";

export const mixedChanges: ArtifactDiff[] = [
	{
		id: "app",
		name: "app",
		status: "updated",
		raw: { oldSize: 90, newSize: 100, difference: 10 },
		gzip: { oldSize: 75, newSize: 80, difference: 5 },
		brotli: { oldSize: 72, newSize: 70, difference: -2 },
		oldFiles: [
			{ filename: "dist/a.js", size: 65, gzip: 55, brotli: 45 },
			{ filename: "dist/b.js", size: 25, gzip: 15, brotli: 18 },
		],
		newFiles: [
			{ filename: "dist/a.js", size: 70, gzip: 60, brotli: 50 },
			{ filename: "dist/b.js", size: 30, gzip: 20, brotli: 20 },
		],
	},
	{
		id: "lib",
		name: "lib",
		status: "updated",
		raw: { oldSize: 200, newSize: 200, difference: 0 },
		gzip: { oldSize: 150, newSize: 150, difference: 0 },
		brotli: { oldSize: 120, newSize: 120, difference: 0 },
		oldFiles: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
		newFiles: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
	},
	{
		id: "vendor",
		name: "vendor",
		status: "updated",
		raw: { oldSize: 300, newSize: 250, difference: -50 },
		gzip: { oldSize: 250, newSize: 210, difference: -40 },
		brotli: { oldSize: 230, newSize: 200, difference: -30 },
		oldFiles: [{ filename: "dist/vendor.js", size: 300, gzip: 250, brotli: 230 }],
		newFiles: [{ filename: "dist/vendor.js", size: 250, gzip: 210, brotli: 200 }],
	},
];
