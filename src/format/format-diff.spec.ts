import util, { stripVTControlCharacters } from "node:util";
import { describe, expect, it, vi } from "vitest";
import { type ArtifactDiff } from "../artifact-diff.ts";
import { formatDiff } from "./format-diff.ts";

vi.spyOn(util, "styleText").mockImplementation((color, text) => `<${color}>${text}</${color}>`);

expect.addSnapshotSerializer({
	test() {
		return true;
	},
	serialize(value) {
		return stripVTControlCharacters(String(value));
	},
});

const updated: ArtifactDiff[] = [
	{
		id: "app",
		name: "app",
		status: "updated",
		raw: { oldSize: 90, newSize: 100, difference: 10 },
		gzip: { oldSize: 75, newSize: 80, difference: 5 },
		brotli: { oldSize: 72, newSize: 70, difference: -2 },
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
		id: "lib",
		name: "lib",
		status: "updated",
		raw: { oldSize: 200, newSize: 200, difference: 0 },
		gzip: { oldSize: 150, newSize: 150, difference: 0 },
		brotli: { oldSize: 120, newSize: 120, difference: 0 },
		oldFiles: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
		newFiles: [{ filename: "dist/lib.js", size: 200, gzip: 150, brotli: 120 }],
	},
	{
		id: "vendor",
		name: "vendor",
		status: "updated",
		raw: { oldSize: 300, newSize: 250, difference: -50 },
		gzip: { oldSize: 250, newSize: 210, difference: -40 },
		brotli: { oldSize: 230, newSize: 200, difference: -30 },
		oldFiles: [{ filename: "dist/vendor.js", size: 300, gzip: 250, brotli: 230 }],
		newFiles: [{ filename: "dist/vendor.js", size: 250, gzip: 210, brotli: 200 }],
	},
];

const added: ArtifactDiff[] = [
	{
		id: "new",
		name: "new",
		status: "added",
		raw: { oldSize: 0, newSize: 150, difference: 150 },
		gzip: { oldSize: 0, newSize: 100, difference: 100 },
		brotli: { oldSize: 0, newSize: 80, difference: 80 },
		oldFiles: [],
		newFiles: [{ filename: "dist/new.js", size: 150, gzip: 100, brotli: 80 }],
	},
];

const removed: ArtifactDiff[] = [
	{
		id: "old",
		name: "old",
		status: "removed",
		raw: { oldSize: 200, newSize: 0, difference: -200 },
		gzip: { oldSize: 120, newSize: 0, difference: -120 },
		brotli: { oldSize: 80, newSize: 0, difference: -80 },
		oldFiles: [{ filename: "dist/old.js", size: 200, gzip: 120, brotli: 80 }],
		newFiles: [],
	},
];

const addedNoCompress: ArtifactDiff[] = [
	{
		id: "new-nc",
		name: "new-nc",
		status: "added",
		raw: { oldSize: 0, newSize: 150, difference: 150 },
		gzip: null,
		brotli: null,
		oldFiles: [],
		newFiles: [{ filename: "dist/new-nc.js", size: 150, gzip: null, brotli: null }],
	},
];

const removedNoCompress: ArtifactDiff[] = [
	{
		id: "old-nc",
		name: "old-nc",
		status: "removed",
		raw: { oldSize: 200, newSize: 0, difference: -200 },
		gzip: null,
		brotli: null,
		oldFiles: [{ filename: "dist/old-nc.js", size: 200, gzip: null, brotli: null }],
		newFiles: [],
	},
];

const updatedOneAlgorithm: ArtifactDiff[] = [
	{
		id: "one-a",
		name: "one-a",
		status: "updated",
		raw: { oldSize: 90, newSize: 100, difference: 10 },
		gzip: { oldSize: 75, newSize: 80, difference: 5 },
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
	{
		id: "one-b",
		name: "one-b",
		status: "updated",
		raw: { oldSize: 50, newSize: 60, difference: 10 },
		gzip: { oldSize: 40, newSize: 45, difference: 5 },
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
];

const updatedBothDisabled: ArtifactDiff[] = [
	{
		id: "none-a",
		name: "none-a",
		status: "updated",
		raw: { oldSize: 90, newSize: 100, difference: 10 },
		gzip: null,
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
	{
		id: "none-b",
		name: "none-b",
		status: "updated",
		raw: { oldSize: 50, newSize: 60, difference: 10 },
		gzip: null,
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
];

const updatedMixedAlgorithms: ArtifactDiff[] = [
	{
		id: "all-enabled",
		name: "all-enabled",
		status: "updated",
		raw: { oldSize: 120, newSize: 130, difference: 10 },
		gzip: { oldSize: 90, newSize: 95, difference: 5 },
		brotli: { oldSize: 80, newSize: 85, difference: 5 },
		oldFiles: [],
		newFiles: [],
	},
	{
		id: "brotli-only",
		name: "brotli-only",
		status: "updated",
		raw: { oldSize: 70, newSize: 75, difference: 5 },
		gzip: null,
		brotli: { oldSize: 60, newSize: 62, difference: 2 },
		oldFiles: [],
		newFiles: [],
	},
	{
		id: "all-disabled",
		name: "all-disabled",
		status: "updated",
		raw: { oldSize: 30, newSize: 40, difference: 10 },
		gzip: null,
		brotli: null,
		oldFiles: [],
		newFiles: [],
	},
];

const removedFiles: ArtifactDiff[] = [
	{
		id: "removed-files",
		name: "removed-files",
		status: "updated",
		raw: { oldSize: 120, newSize: 110, difference: -10 },
		gzip: null,
		brotli: null,
		oldFiles: [
			{ filename: "dist/a.js", size: 60, gzip: null, brotli: null },
			{ filename: "dist/b.js", size: 60, gzip: null, brotli: null },
		],
		newFiles: [{ filename: "dist/a.js", size: 110, gzip: null, brotli: null }],
	},
];

describe("formatDiff()", () => {
	describe("json", () => {
		it("formats updated artifacts", () => {
			const out = formatDiff(updated, "json", { color: false });
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(updated);
		});

		it("formats added artifact", () => {
			const outJson = formatDiff(added, "json", { color: false });
			const parsedJson = JSON.parse(outJson);
			expect(parsedJson).toEqual(added);
		});

		it("formats removed artifact", () => {
			const outJson = formatDiff(removed, "json", { color: false });
			const parsedJson = JSON.parse(outJson);
			expect(parsedJson).toEqual(removed);
		});

		it("formats artifacts with only one algorithm enabled", () => {
			const out = formatDiff(updatedOneAlgorithm, "json", { color: false });
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(updatedOneAlgorithm);
		});

		it("formats artifacts with all algorithms disabled", () => {
			const out = formatDiff(updatedBothDisabled, "json", { color: false });
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(updatedBothDisabled);
		});

		it("formats artifacts with mixed algorithms", () => {
			const out = formatDiff(updatedMixedAlgorithms, "json", { color: false });
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(updatedMixedAlgorithms);
		});

		it("formats artifact with removed file", () => {
			const out = formatDiff(removedFiles, "json", { color: false });
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(removedFiles);
		});

		it("formats added artifact with no compression", () => {
			const out = formatDiff(addedNoCompress, "json", { color: false });
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(addedNoCompress);
		});

		it("formats removed artifact with no compression", () => {
			const out = formatDiff(removedNoCompress, "json", { color: false });
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(removedNoCompress);
		});
	});

	describe("markdown", () => {
		it("formats updated artifacts", () => {
			const out = formatDiff(updated, "markdown", { color: false });
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |
				| lib | 1 file(s) | 200B → **200B** (+0B) | gzip: 150B<br>brotli: 120B | - |
				| vendor | 1 file(s) | 300B → **250B** (-50B) | gzip: 210B<br>brotli: 200B | -16.67% |
			`);
		});

		it("formats added artifact", () => {
			const outMd = formatDiff(added, "markdown", { color: false });
			expect(outMd).toMatchInlineSnapshot(`
				## Artifact sizes

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| new (added) | 1 file(s) | N/A → **150B** | gzip: 100B<br>brotli: 80B | +0.00% |
			`);
		});

		it("formats removed artifact", () => {
			const outMd = formatDiff(removed, "markdown", { color: false });
			expect(outMd).toMatchInlineSnapshot(`
				## Artifact sizes

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| old (removed) | N/A | 200B → N/A | N/A | N/A |
			`);
		});

		it("formats artifacts with only one algorithm enabled", () => {
			const out = formatDiff(updatedOneAlgorithm, "markdown", { color: false });
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| one-a | 0 file(s) | 90B → **100B** (+10B) | gzip: 80B | +11.11% |
				| one-b | 0 file(s) | 50B → **60B** (+10B) | gzip: 45B | +20.00% |
			`);
		});

		it("formats artifacts with all algorithms disabled", () => {
			const out = formatDiff(updatedBothDisabled, "markdown", { color: false });
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				| Artifact | Files | Size | Change |
				|---|---|---:|---:|
				| none-a | 0 file(s) | 90B → **100B** (+10B) | +11.11% |
				| none-b | 0 file(s) | 50B → **60B** (+10B) | +20.00% |
			`);
		});

		it("formats artifacts with mixed algorithms", () => {
			const out = formatDiff(updatedMixedAlgorithms, "markdown", { color: false });
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| all-enabled | 0 file(s) | 120B → **130B** (+10B) | gzip: 95B<br>brotli: 85B | +8.33% |
				| brotli-only | 0 file(s) | 70B → **75B** (+5B) | brotli: 62B | +7.14% |
				| all-disabled | 0 file(s) | 30B → **40B** (+10B) | N/A | +33.33% |
			`);
		});

		it("formats artifact with removed file", () => {
			const out = formatDiff(removedFiles, "markdown", { color: false });
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				| Artifact | Files | Size | Change |
				|---|---|---:|---:|
				| removed-files | 1 file(s) | 120B → **110B** (-10B) | -8.33% |
			`);
		});

		it("formats added artifact with no compression (no compressed column)", () => {
			const outMd = formatDiff(addedNoCompress, "markdown", { color: false });
			expect(outMd).toMatchInlineSnapshot(`
				## Artifact sizes

				| Artifact | Files | Size | Change |
				|---|---|---:|---:|
				| new-nc (added) | 1 file(s) | N/A → **150B** | +0.00% |
			`);
		});

		it("formats removed artifact with no compression (no compressed column)", () => {
			const outMd = formatDiff(removedNoCompress, "markdown", { color: false });
			expect(outMd).toMatchInlineSnapshot(`
				## Artifact sizes

				| Artifact | Files | Size | Change |
				|---|---|---:|---:|
				| old-nc (removed) | N/A | 200B → N/A | N/A |
			`);
		});
	});

	describe("text", () => {
		it("formats updated artifacts", () => {
			const out = formatDiff(updated, "text", { color: false });
			expect(out).toMatchInlineSnapshot(`
				app: files=2 (+0), size=100B (+10B), gzip=80B (+5B), brotli=70B (-2B)
				lib: files=1 (+0), size=200B (+0B), gzip=150B (+0B), brotli=120B (+0B)
				vendor: files=1 (+0), size=250B (-50B), gzip=210B (-40B), brotli=200B (-30B)
			`);
		});

		it("formats added artifact", () => {
			const outText = formatDiff(added, "text", { color: false });
			expect(outText).toMatchInlineSnapshot(`
				new: files=1 (+1), size=150B (+150B), gzip=100B (+100B), brotli=80B (+80B)
			`);
		});

		it("formats removed artifact", () => {
			const outText = formatDiff(removed, "text", { color: false });
			expect(outText).toMatchInlineSnapshot(`
				old: removed
			`);
		});

		it("formats artifacts with only one algorithm enabled", () => {
			const out = formatDiff(updatedOneAlgorithm, "text", { color: false });
			expect(out).toMatchInlineSnapshot(`
				one-a: files=0 (+0), size=100B (+10B), gzip=80B (+5B)
				one-b: files=0 (+0), size=60B (+10B), gzip=45B (+5B)
			`);
		});

		it("formats artifacts with all algorithms disabled", () => {
			const out = formatDiff(updatedBothDisabled, "text", { color: false });
			expect(out).toMatchInlineSnapshot(`
				none-a: files=0 (+0), size=100B (+10B)
				none-b: files=0 (+0), size=60B (+10B)
			`);
		});

		it("formats artifacts with mixed algorithms", () => {
			const out = formatDiff(updatedMixedAlgorithms, "text", { color: false });
			expect(out).toMatchInlineSnapshot(`
				all-enabled: files=0 (+0), size=130B (+10B), gzip=95B (+5B), brotli=85B (+5B)
				brotli-only: files=0 (+0), size=75B (+5B), brotli=62B (+2B)
				all-disabled: files=0 (+0), size=40B (+10B)
			`);
		});

		it("formats artifact with removed file", () => {
			const out = formatDiff(removedFiles, "text", { color: false });
			expect(out).toMatchInlineSnapshot(`removed-files: files=1 (-1), size=110B (-10B)`);
		});

		it("formats added artifact with no compression (text)", () => {
			const out = formatDiff(addedNoCompress, "text", { color: false });
			expect(out).toMatchInlineSnapshot(`
				new-nc: files=1 (+1), size=150B (+150B)
			`);
		});

		it("formats removed artifact with no compression (text)", () => {
			const out = formatDiff(removedNoCompress, "text", { color: false });
			expect(out).toMatchInlineSnapshot(`
				old-nc: removed
			`);
		});

		it("colorize output", () => {
			const out = formatDiff(updated, "text", { color: true });
			expect(out).toMatchInlineSnapshot(`
				app: files=<cyan>2</cyan> (+0), size=<cyan>100B</cyan> (+10B), gzip=<cyan>80B</cyan> (+5B), brotli=<cyan>70B</cyan> (-2B)
				lib: files=<cyan>1</cyan> (+0), size=<cyan>200B</cyan> (+0B), gzip=<cyan>150B</cyan> (+0B), brotli=<cyan>120B</cyan> (+0B)
				vendor: files=<cyan>1</cyan> (+0), size=<cyan>250B</cyan> (-50B), gzip=<cyan>210B</cyan> (-40B), brotli=<cyan>200B</cyan> (-30B)
			`);
		});
	});
});
