import { describe, expect, it } from "vitest";
import { type BundleSize } from "../bundle-size.ts";
import { compareBundles } from "./compare-bundles.ts";

const base = [
	{ id: "app", bundle: "app", files: [], size: 1000, gzip: 300, brotli: 200 },
	{ id: "lib", bundle: "lib", files: [], size: 2000, gzip: 800, brotli: 600 },
] satisfies BundleSize[];

const current = [
	{ id: "app", bundle: "app", files: [], size: 1100, gzip: 320, brotli: 210 },
	{ id: "lib", bundle: "lib", files: [], size: 1900, gzip: 790, brotli: 590 },
] satisfies BundleSize[];

describe("compareBundles()", () => {
	it("should compare two bundles", () => {
		const res = compareBundles(base, current);
		expect(res).toEqual([
			{
				id: "app",
				name: "app",
				status: "updated",
				oldSize: 1000,
				newSize: 1100,
				sizeDiff: 100,
				oldGzip: 300,
				newGzip: 320,
				gzipDiff: 20,
				oldBrotli: 200,
				newBrotli: 210,
				brotliDiff: 10,
				oldFiles: base[0].files,
				newFiles: current[0].files,
			},
			{
				id: "lib",
				name: "lib",
				status: "updated",
				oldSize: 2000,
				newSize: 1900,
				sizeDiff: -100,
				oldGzip: 800,
				newGzip: 790,
				gzipDiff: -10,
				oldBrotli: 600,
				newBrotli: 590,
				brotliDiff: -10,
				oldFiles: base[1].files,
				newFiles: current[1].files,
			},
		]);
	});
});
