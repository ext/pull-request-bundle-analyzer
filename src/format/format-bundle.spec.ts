import { stripVTControlCharacters } from "node:util";
import { describe, expect, it } from "vitest";
import { type BundleSize } from "../bundle-size.ts";
import { formatBundle } from "./format-bundle.ts";

expect.addSnapshotSerializer({
	test() {
		return true;
	},
	serialize(value) {
		return stripVTControlCharacters(String(value));
	},
});

const data = [
	{
		id: "app",
		bundle: "app",
		files: [
			{ filename: "dist/a.js", size: 70, gzip: 60, brotli: 50 },
			{ filename: "dist/b.js", size: 30, gzip: 20, brotli: 20 },
		],
		size: 100,
		gzip: 80,
		brotli: 70,
	},
	{
		id: "lib",
		bundle: "lib",
		files: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
		size: 200,
		gzip: 150,
		brotli: 120,
	},
] satisfies BundleSize[];

describe("formatResult()", () => {
	it("formats json", () => {
		const out = formatBundle(data, "json", { color: false });
		const parsed = JSON.parse(out);
		expect(parsed).toEqual([
			{
				id: "app",
				bundle: "app",
				files: [
					{
						filename: "dist/a.js",
						size: 70,
						gzip: 60,
						brotli: 50,
					},
					{
						filename: "dist/b.js",
						size: 30,
						gzip: 20,
						brotli: 20,
					},
				],
				size: 100,
				gzip: 80,
				brotli: 70,
			},
			{
				id: "lib",
				bundle: "lib",
				files: [
					{
						filename: "dist/lib.js",
						size: 200,
						gzip: 150,
						brotli: 120,
					},
				],
				size: 200,
				gzip: 150,
				brotli: 120,
			},
		]);
	});

	it("formats markdown", () => {
		const out = formatBundle(data, "markdown", { color: false });
		expect(out).toMatchInlineSnapshot(`
			## Bundle sizes

			| Bundle | Files | Size | Gzip | Brotli |
			|---|---|---:|---:|---:|
			| \`app\` | 2 file(s) | 100B | 80B | 70B |
			| \`lib\` | 1 file(s) | 200B | 150B | 120B |
		`);
	});

	it("formats text", () => {
		const out = formatBundle(data, "text", { color: false });
		expect(out).toMatchInlineSnapshot(`
			app: files=2, size=100B, gzip=80B, brotli=70B
			 ├ dist/a.js size=70B, gzip=60B, brotli=50B
			 └ dist/b.js size=30B, gzip=20B, brotli=20B
			lib: files=1, size=200B, gzip=150B, brotli=120B
			 └ dist/lib.js size=200B, gzip=150B, brotli=120B
		`);
	});
});
