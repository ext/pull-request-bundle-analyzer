import { describe, expect, it } from "vitest";
import type { BundleSize } from "../bundle-size.ts";
import { compareBundle } from "./compare-bundle.ts";

describe("compareBundle()", () => {
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
			raw: { oldSize: 1000, newSize: 1200, difference: 200 },
			gzip: { oldSize: 300, newSize: 350, difference: 50 },
			brotli: { oldSize: 200, newSize: 180, difference: -20 },
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
			raw: { oldSize: 0, newSize: 500, difference: 500 },
			gzip: { oldSize: 0, newSize: 200, difference: 200 },
			brotli: { oldSize: 0, newSize: 150, difference: 150 },
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
			raw: { oldSize: 400, newSize: 0, difference: -400 },
			gzip: { oldSize: 120, newSize: 0, difference: -120 },
			brotli: { oldSize: 90, newSize: 0, difference: -90 },
			oldFiles: base.files,
			newFiles: [],
		});
	});

	it("should set gzip to null when either base or current gzip is null", () => {
		const base: BundleSize = {
			id: "app",
			bundle: "app",
			files: [],
			size: 1000,
			gzip: null,
			brotli: 200,
		};
		const current: BundleSize = {
			id: "app",
			bundle: "app",
			files: [],
			size: 1100,
			gzip: 320,
			brotli: 210,
		};

		const res = compareBundle(base, current);

		expect(res.brotli).toEqual({ oldSize: 200, newSize: 210, difference: 10 });
	});

	it("should set brotli to null when either base or current brotli is null", () => {
		const base: BundleSize = {
			id: "app",
			bundle: "app",
			files: [],
			size: 1000,
			gzip: 300,
			brotli: null,
		};
		const current: BundleSize = {
			id: "app",
			bundle: "app",
			files: [],
			size: 1100,
			gzip: 320,
			brotli: 210,
		};

		const res = compareBundle(base, current);

		expect(res.brotli).toBeNull();
		expect(res.gzip).toEqual({ oldSize: 300, newSize: 320, difference: 20 });
	});

	it("should set gzip/brotli to null when current compression is null", () => {
		const base: BundleSize | undefined = undefined;
		const current: BundleSize = {
			id: "new",
			bundle: "new",
			files: [],
			size: 500,
			gzip: null,
			brotli: null,
		};

		const res = compareBundle(base, current);
		expect(res.gzip).toBeNull();
		expect(res.brotli).toBeNull();
	});

	it("should set gzip/brotli to null when base compression is null", () => {
		const base: BundleSize = {
			id: "old",
			bundle: "old",
			files: [],
			size: 400,
			gzip: null,
			brotli: null,
		};
		const current: BundleSize | undefined = undefined;
		const res = compareBundle(base, current);
		expect(res.gzip).toBeNull();
		expect(res.brotli).toBeNull();
	});
});
