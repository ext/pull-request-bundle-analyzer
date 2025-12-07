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
});
