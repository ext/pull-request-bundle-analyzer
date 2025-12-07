import nodefs from "node:fs/promises";
import { Volume } from "memfs";
import { describe, expect, it } from "vitest";
import { type NormalizedBundleConfig } from "./config/index.ts";
import { getBundleSize } from "./get-bundle-size.ts";

const cwd = "/";

describe("getBundleSize()", () => {
	it("aggregates sizes from single files", async () => {
		const a = "a".repeat(2000);
		const vol = Volume.fromJSON({ "/dist/a.js": a });
		const fs = vol.promises as unknown as typeof nodefs;

		const bundle: NormalizedBundleConfig = {
			id: "app",
			name: "app",
			include: ["dist/*.js"],
			exclude: [],
		};

		const result = await getBundleSize(bundle, { cwd, fs });

		/* aggregated results */
		expect(result.size).toEqual(2000);
		expect(result.gzip).toBeGreaterThan(0);
		expect(result.brotli).toBeGreaterThan(0);
		expect(result.gzip).toBeLessThan(2000);
		expect(result.brotli).toBeLessThan(2000);
		expect(result.files).toHaveLength(1);

		/* per-file results */
		expect(result.files[0].size).toBe(2000);
		expect(result.files[0].gzip).toBeGreaterThan(0);
		expect(result.files[0].brotli).toBeGreaterThan(0);
		expect(result.files[0].gzip).toBeLessThan(2000);
		expect(result.files[0].brotli).toBeLessThan(2000);
	});

	it("aggregates sizes from multiple files", async () => {
		const a = "a".repeat(2000);
		const b = "b".repeat(3000);
		const vol = Volume.fromJSON({ "/dist/a.js": a, "/dist/b.js": b });
		const fs = vol.promises as unknown as typeof nodefs;

		const bundle: NormalizedBundleConfig = {
			id: "app",
			name: "app",
			include: ["dist/*.js"],
			exclude: [],
		};

		const result = await getBundleSize(bundle, { cwd, fs });

		/* aggregated results */
		expect(result.size).toEqual(5000);
		expect(result.gzip).toBeGreaterThan(0);
		expect(result.brotli).toBeGreaterThan(0);
		expect(result.gzip).toBeLessThan(5000);
		expect(result.brotli).toBeLessThan(5000);

		/* per-file results */
		expect(result.files).toHaveLength(2);
		expect(result.files[0].size).toBe(2000);
		expect(result.files[0].gzip).toBeGreaterThan(0);
		expect(result.files[0].brotli).toBeGreaterThan(0);
		expect(result.files[0].gzip).toBeLessThan(2000);
		expect(result.files[0].brotli).toBeLessThan(2000);
		expect(result.files[1].size).toBe(3000);
		expect(result.files[1].gzip).toBeGreaterThan(0);
		expect(result.files[1].brotli).toBeGreaterThan(0);
		expect(result.files[1].gzip).toBeLessThan(3000);
		expect(result.files[1].brotli).toBeLessThan(3000);
	});

	it("returns zeros when there are no files", async () => {
		const vol = Volume.fromJSON({});
		const fs = vol.promises as unknown as typeof nodefs;

		const bundle: NormalizedBundleConfig = {
			id: "empty",
			name: "empty",
			include: [],
			exclude: [],
		};

		const result = await getBundleSize(bundle, { cwd, fs });
		expect(result).toEqual({
			id: "empty",
			bundle: "empty",
			files: [],
			size: 0,
			gzip: 0,
			brotli: 0,
		});
	});
});
