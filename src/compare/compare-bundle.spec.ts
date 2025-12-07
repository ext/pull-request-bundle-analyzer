import { describe, expect, it } from "vitest";
import type { BundleSize } from "../bundle-size.ts";
import { compareBundle } from "./compare-bundle.ts";

describe("compareBundleResults()", () => {
	it("should compute differences", () => {
		const base: BundleSize = {
			id: "app",
			bundle: "app",
			files: [],
			size: 1000,
			gzip: 300,
			brotli: 200,
		};
		const current: BundleSize = {
			id: "app",
			bundle: "app",
			files: [],
			size: 1200,
			gzip: 350,
			brotli: 180,
		};
		const res = compareBundle(base, current);
		expect(res).toEqual({
			id: "app",
			name: "app",
			status: "updated",
			oldSize: 1000,
			newSize: 1200,
			sizeDiff: 200,
			oldGzip: 300,
			newGzip: 350,
			gzipDiff: 50,
			oldBrotli: 200,
			newBrotli: 180,
			brotliDiff: -20,
			oldFiles: base.files,
			newFiles: current.files,
		});
	});

	it("should handle added bundles", () => {
		const base: BundleSize | undefined = undefined;
		const current: BundleSize = {
			id: "new",
			bundle: "new",
			files: [],
			size: 500,
			gzip: 200,
			brotli: 150,
		};
		const res = compareBundle(base, current);
		expect(res).toEqual({
			status: "added",
			id: "new",
			name: "new",
			oldSize: 0,
			newSize: 500,
			sizeDiff: 500,
			oldGzip: 0,
			newGzip: 200,
			gzipDiff: 200,
			oldBrotli: 0,
			newBrotli: 150,
			brotliDiff: 150,
			oldFiles: [],
			newFiles: current.files,
		});
	});

	it("should handle removed bundles", () => {
		const base: BundleSize = {
			id: "old",
			bundle: "old",
			files: [],
			size: 400,
			gzip: 120,
			brotli: 90,
		};
		const current: BundleSize | undefined = undefined;
		const res = compareBundle(base, current);
		expect(res).toEqual({
			status: "removed",
			id: "old",
			name: "old",
			oldSize: 400,
			newSize: 0,
			sizeDiff: -400,
			oldGzip: 120,
			newGzip: 0,
			gzipDiff: -120,
			oldBrotli: 90,
			newBrotli: 0,
			brotliDiff: -90,
			oldFiles: base.files,
			newFiles: [],
		});
	});
});
