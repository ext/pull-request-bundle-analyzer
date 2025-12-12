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
				raw: { oldSize: 1000, newSize: 1100, difference: 100 },
				gzip: { oldSize: 300, newSize: 320, difference: 20 },
				brotli: { oldSize: 200, newSize: 210, difference: 10 },
				oldFiles: base[0].files,
				newFiles: current[0].files,
			},
			{
				id: "lib",
				name: "lib",
				status: "updated",
				raw: { oldSize: 2000, newSize: 1900, difference: -100 },
				gzip: { oldSize: 800, newSize: 790, difference: -10 },
				brotli: { oldSize: 600, newSize: 590, difference: -10 },
				oldFiles: base[1].files,
				newFiles: current[1].files,
			},
		]);
	});
});
