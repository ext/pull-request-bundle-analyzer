import { describe, expect, it } from "vitest";
import { type ArtifactSize } from "../artifact-size.ts";
import { compareArtifact } from "./compare-artifact.ts";

describe("compareArtifact()", () => {
	it("should compute differences", () => {
		const base: ArtifactSize = {
			id: "app",
			artifact: "app",
			files: [],
			size: 1000,
			gzip: 300,
			brotli: 200,
		};
		const current: ArtifactSize = {
			id: "app",
			artifact: "app",
			files: [],
			size: 1200,
			gzip: 350,
			brotli: 180,
		};
		const res = compareArtifact(base, current);
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

	it("should handle added artifacts", () => {
		const base: ArtifactSize | undefined = undefined;
		const current: ArtifactSize = {
			id: "new",
			artifact: "new",
			files: [],
			size: 500,
			gzip: 200,
			brotli: 150,
		};
		const res = compareArtifact(base, current);
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

	it("should handle removed artifacts", () => {
		const base: ArtifactSize = {
			id: "old",
			artifact: "old",
			files: [],
			size: 400,
			gzip: 120,
			brotli: 90,
		};
		const current: ArtifactSize | undefined = undefined;
		const res = compareArtifact(base, current);
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
		const base: ArtifactSize = {
			id: "app",
			artifact: "app",
			files: [],
			size: 1000,
			gzip: null,
			brotli: 200,
		};
		const current: ArtifactSize = {
			id: "app",
			artifact: "app",
			files: [],
			size: 1100,
			gzip: 320,
			brotli: 210,
		};

		const res = compareArtifact(base, current);

		expect(res.brotli).toEqual({ oldSize: 200, newSize: 210, difference: 10 });
	});

	it("should set brotli to null when either base or current brotli is null", () => {
		const base: ArtifactSize = {
			id: "app",
			artifact: "app",
			files: [],
			size: 1000,
			gzip: 300,
			brotli: null,
		};
		const current: ArtifactSize = {
			id: "app",
			artifact: "app",
			files: [],
			size: 1100,
			gzip: 320,
			brotli: 210,
		};

		const res = compareArtifact(base, current);

		expect(res.brotli).toBeNull();
		expect(res.gzip).toEqual({ oldSize: 300, newSize: 320, difference: 20 });
	});

	it("should set gzip/brotli to null when current compression is null", () => {
		const base: ArtifactSize | undefined = undefined;
		const current: ArtifactSize = {
			id: "new",
			artifact: "new",
			files: [],
			size: 500,
			gzip: null,
			brotli: null,
		};

		const res = compareArtifact(base, current);
		expect(res.gzip).toBeNull();
		expect(res.brotli).toBeNull();
	});

	it("should set gzip/brotli to null when base compression is null", () => {
		const base: ArtifactSize = {
			id: "old",
			artifact: "old",
			files: [],
			size: 400,
			gzip: null,
			brotli: null,
		};
		const current: ArtifactSize | undefined = undefined;
		const res = compareArtifact(base, current);
		expect(res.gzip).toBeNull();
		expect(res.brotli).toBeNull();
	});
});
