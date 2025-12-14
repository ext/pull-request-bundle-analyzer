import util, { stripVTControlCharacters } from "node:util";
import { describe, expect, it, vi } from "vitest";
import { type ArtifactSize } from "../artifact-size.ts";
import { formatArtifact } from "./format-artifact.ts";

vi.spyOn(util, "styleText").mockImplementation((color, text) => `<${color}>${text}</${color}>`);

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
		artifact: "app",
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
		artifact: "lib",
		files: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
		size: 200,
		gzip: 150,
		brotli: 120,
	},
] satisfies ArtifactSize[];

describe("formatArtifact()", () => {
	it("formats json", () => {
		const out = formatArtifact(data, "json");
		const parsed = JSON.parse(out);
		expect(parsed).toEqual([
			{
				id: "app",
				artifact: "app",
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
				artifact: "lib",
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

	it("formats artifacts with no files and no compression", () => {
		const empty: ArtifactSize[] = [
			{
				id: "empty",
				artifact: "empty",
				files: [],
				size: 0,
				gzip: null,
				brotli: null,
			},
		];

		// json
		const outJson = formatArtifact(empty, "json");
		const parsed = JSON.parse(outJson);
		expect(parsed).toEqual(empty);

		// markdown
		const outMd = formatArtifact(empty, "markdown");
		expect(outMd).toMatchInlineSnapshot(`
			## Artifact sizes

			| Artifact | Files | Size | Gzip | Brotli |
			|---|---|---:|---:|---:|
			| \`empty\` | 0 file(s) | 0B | - | - |
		`);

		// text
		const outText = formatArtifact(empty, "text");
		expect(outText).toMatchInlineSnapshot(`empty: files=0, size=0B, gzip=-, brotli=-`);
	});

	it("formats artifact with only one algorithm enabled", () => {
		const single: ArtifactSize[] = [
			{
				id: "single",
				artifact: "single",
				files: [{ filename: "dist/s.js", size: 100, gzip: 80, brotli: null }],
				size: 100,
				gzip: 80,
				brotli: null,
			},
		];

		// json
		const outJson = formatArtifact(single, "json");
		const parsed = JSON.parse(outJson);
		expect(parsed).toEqual(single);

		// markdown
		const outMd = formatArtifact(single, "markdown");
		expect(outMd).toMatchInlineSnapshot(`
			## Artifact sizes

			| Artifact | Files | Size | Gzip | Brotli |
			|---|---|---:|---:|---:|
			| \`single\` | 1 file(s) | 100B | 80B | - |
		`);

		// text
		const outText = formatArtifact(single, "text");
		expect(outText).toMatchInlineSnapshot(`
			single: files=1, size=100B, gzip=80B, brotli=-
			 └ dist/s.js size=100B, gzip=80B, brotli=-
		`);
	});

	it("formats markdown", () => {
		const out = formatArtifact(data, "markdown");
		expect(out).toMatchInlineSnapshot(`
			## Artifact sizes

			| Artifact | Files | Size | Gzip | Brotli |
			|---|---|---:|---:|---:|
			| \`app\` | 2 file(s) | 100B | 80B | 70B |
			| \`lib\` | 1 file(s) | 200B | 150B | 120B |
		`);
	});

	it("should include header when header is true", () => {
		const out = formatArtifact(data, "markdown", { header: true });
		expect(out).toContain("## Artifact sizes");
	});

	it("should omit header when header is false", () => {
		const out = formatArtifact(data, "markdown", { color: false, header: false });
		expect(out).not.toContain("## Artifact sizes");
	});

	it("formats text", () => {
		const out = formatArtifact(data, "text");
		expect(out).toMatchInlineSnapshot(`
			app: files=2, size=100B, gzip=80B, brotli=70B
			 ├ dist/a.js size=70B, gzip=60B, brotli=50B
			 └ dist/b.js size=30B, gzip=20B, brotli=20B
			lib: files=1, size=200B, gzip=150B, brotli=120B
			 └ dist/lib.js size=200B, gzip=150B, brotli=120B
		`);
	});

	it("should colorize text output", () => {
		const out = formatArtifact(data, "text", { color: true, header: true });
		expect(out).toMatchInlineSnapshot(`
			app: files=<cyan>2</cyan>, size=<cyan>100B</cyan>, gzip=<cyan>80B</cyan>, brotli=<cyan>70B</cyan>
			 ├ dist/a.js size=<cyan>70B</cyan>, gzip=<cyan>60B</cyan>, brotli=<cyan>50B</cyan>
			 └ dist/b.js size=<cyan>30B</cyan>, gzip=<cyan>20B</cyan>, brotli=<cyan>20B</cyan>
			lib: files=<cyan>1</cyan>, size=<cyan>200B</cyan>, gzip=<cyan>150B</cyan>, brotli=<cyan>120B</cyan>
			 └ dist/lib.js size=<cyan>200B</cyan>, gzip=<cyan>150B</cyan>, brotli=<cyan>120B</cyan>
		`);
	});
});
