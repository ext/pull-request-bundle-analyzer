import nodefs from "node:fs/promises";
import { Volume } from "memfs";
import { describe, expect, it } from "vitest";
import { analyzeArtifact } from "./analyze-artifact.ts";
import { type NormalizedArtifactConfig } from "./config/index.ts";

const cwd = "/";

describe("analyzeArtifact()", () => {
	it("should aggregate sizes from single files", async () => {
		const a = "a".repeat(2000);
		const vol = Volume.fromJSON({ "/dist/a.js": a });
		const fs = vol.promises as unknown as typeof nodefs;

		const artifact: Pick<NormalizedArtifactConfig, "id" | "name" | "include" | "exclude"> = {
			id: "app",
			name: "app",
			include: ["dist/*.js"],
			exclude: [],
		};

		const compression = { gzip: true, brotli: true };
		const result = await analyzeArtifact(artifact, { cwd, fs, compression });

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

	it("should support disabling gzip (brotli only)", async () => {
		const a = "a".repeat(2000);
		const vol = Volume.fromJSON({ "/dist/a.js": a });
		const fs = vol.promises as unknown as typeof nodefs;

		const artifact: Pick<NormalizedArtifactConfig, "id" | "name" | "include" | "exclude"> = {
			id: "brotli-only",
			name: "brotli-only",
			include: ["dist/*.js"],
			exclude: [],
		};

		const compression = { gzip: false, brotli: true };
		const result = await analyzeArtifact(artifact, { cwd, fs, compression });

		expect(result.size).toEqual(2000);
		expect(result.gzip).toBeNull();
		expect(result.brotli).toBeGreaterThan(0);
		expect(result.files).toHaveLength(1);

		expect(result.files[0].size).toBe(2000);
		expect(result.files[0].gzip).toBeNull();
		expect(result.files[0].brotli).toBeGreaterThan(0);
	});

	it("should support disabling brotli (gzip only)", async () => {
		const a = "a".repeat(2000);
		const vol = Volume.fromJSON({ "/dist/a.js": a });
		const fs = vol.promises as unknown as typeof nodefs;

		const artifact: Pick<NormalizedArtifactConfig, "id" | "name" | "include" | "exclude"> = {
			id: "gzip-only",
			name: "gzip-only",
			include: ["dist/*.js"],
			exclude: [],
		};

		const compression = { gzip: true, brotli: false };
		const result = await analyzeArtifact(artifact, { cwd, fs, compression });

		expect(result.size).toEqual(2000);
		expect(result.gzip).toBeGreaterThan(0);
		expect(result.brotli).toBeNull();
		expect(result.files).toHaveLength(1);

		expect(result.files[0].size).toBe(2000);
		expect(result.files[0].gzip).toBeGreaterThan(0);
		expect(result.files[0].brotli).toBeNull();
	});

	it("should support disabling both gzip and brotli", async () => {
		const a = "a".repeat(2000);
		const vol = Volume.fromJSON({ "/dist/a.js": a });
		const fs = vol.promises as unknown as typeof nodefs;

		const artifact: Pick<NormalizedArtifactConfig, "id" | "name" | "include" | "exclude"> = {
			id: "none",
			name: "none",
			include: ["dist/*.js"],
			exclude: [],
		};

		const compression = { gzip: false, brotli: false };
		const result = await analyzeArtifact(artifact, { cwd, fs, compression });

		expect(result.size).toEqual(2000);
		expect(result.gzip).toBeNull();
		expect(result.brotli).toBeNull();
		expect(result.files).toHaveLength(1);

		expect(result.files[0].size).toBe(2000);
		expect(result.files[0].gzip).toBeNull();
		expect(result.files[0].brotli).toBeNull();
	});

	it("should aggregate sizes from multiple files", async () => {
		const a = "a".repeat(2000);
		const b = "b".repeat(3000);
		const vol = Volume.fromJSON({ "/dist/a.js": a, "/dist/b.js": b });
		const fs = vol.promises as unknown as typeof nodefs;

		const artifact: Pick<NormalizedArtifactConfig, "id" | "name" | "include" | "exclude"> = {
			id: "app",
			name: "app",
			include: ["dist/*.js"],
			exclude: [],
		};

		const compression = { gzip: true, brotli: true };
		const result = await analyzeArtifact(artifact, { cwd, fs, compression });

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

	it("should return zeros when there are no files", async () => {
		const vol = Volume.fromJSON({});
		const fs = vol.promises as unknown as typeof nodefs;

		const artifact: Pick<NormalizedArtifactConfig, "id" | "name" | "include" | "exclude"> = {
			id: "empty",
			name: "empty",
			include: [],
			exclude: [],
		};

		const compression = { gzip: true, brotli: true };
		const result = await analyzeArtifact(artifact, { cwd, fs, compression });
		expect(result).toEqual({
			id: "empty",
			artifact: "empty",
			files: [],
			size: 0,
			gzip: 0,
			brotli: 0,
		});
	});
});
