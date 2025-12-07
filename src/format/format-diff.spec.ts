import { stripVTControlCharacters } from "node:util";
import { describe, expect, it } from "vitest";
import { type BundleDiff } from "../bundle-diff.ts";
import { formatDiff } from "./format-diff.ts";

expect.addSnapshotSerializer({
	test() {
		return true;
	},
	serialize(value) {
		return stripVTControlCharacters(String(value));
	},
});

const data: BundleDiff[] = [
	{
		name: "app",
		oldSize: 90,
		newSize: 100,
		sizeDiff: 10,
		oldGzip: 75,
		newGzip: 80,
		gzipDiff: 5,
		oldBrotli: 72,
		newBrotli: 70,
		brotliDiff: -2,
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
		name: "lib",
		oldSize: 200,
		newSize: 200,
		sizeDiff: 0,
		oldGzip: 150,
		newGzip: 150,
		gzipDiff: 0,
		oldBrotli: 120,
		newBrotli: 120,
		brotliDiff: 0,
		oldFiles: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
		newFiles: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
	},
];

describe("formatDiff()", () => {
	it("formats json", () => {
		const out = formatDiff(data, "json", { color: false });
		const parsed = JSON.parse(out);
		expect(parsed).toEqual([
			{
				name: "app",
				oldSize: 90,
				newSize: 100,
				sizeDiff: 10,
				oldGzip: 75,
				newGzip: 80,
				gzipDiff: 5,
				oldBrotli: 72,
				newBrotli: 70,
				brotliDiff: -2,
				newFiles: [
					{ filename: "dist/a.js", size: 70, gzip: 60, brotli: 50 },
					{ filename: "dist/b.js", size: 30, gzip: 20, brotli: 20 },
				],
				oldFiles: [
					{ filename: "dist/a.js", size: 65, gzip: 55, brotli: 45 },
					{ filename: "dist/b.js", size: 25, gzip: 15, brotli: 18 },
				],
			},
			{
				name: "lib",
				oldSize: 200,
				newSize: 200,
				sizeDiff: 0,
				oldGzip: 150,
				newGzip: 150,
				gzipDiff: 0,
				oldBrotli: 120,
				newBrotli: 120,
				brotliDiff: 0,
				newFiles: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
				oldFiles: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
			},
		]);
	});

	it("formats markdown", () => {
		const out = formatDiff(data, "markdown", { color: false });
		expect(out).toMatchInlineSnapshot(`
			## Bundle sizes

			| Bundle | Files | Size | Compressed | Change |
			|---|---|---:|---:|---:|
			| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |
			| lib | 1 file(s) | 200B → **200B** (+0B) | gzip: 150B<br>brotli: 120B | - |
		`);
	});

	it("formats text", () => {
		const out = formatDiff(data, "text", { color: false });
		expect(out).toMatchInlineSnapshot(`
			app: files=2 (+0), size=100B (+10B), gzip=80B (+5B), brotli=70B (-2B)
			lib: files=1 (+0), size=200B (+0B), gzip=150B (+0B), brotli=120B (+0B)
		`);
	});
});
