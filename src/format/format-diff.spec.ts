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

const updated: BundleDiff[] = [
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

const added: BundleDiff[] = [
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

const removed: BundleDiff[] = [
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

describe("formatDiff()", () => {
	describe("json", () => {
		it("formats updated bundles", () => {
			const out = formatDiff(updated, "json", { color: false });
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(updated);
		});

		it("formats added bundle", () => {
			const outJson = formatDiff(added, "json", { color: false });
			const parsedJson = JSON.parse(outJson);
			expect(parsedJson).toEqual(added);
		});

		it("formats removed bundle", () => {
			const outJson = formatDiff(removed, "json", { color: false });
			const parsedJson = JSON.parse(outJson);
			expect(parsedJson).toEqual(removed);
		});
	});

	describe("markdown", () => {
		it("formats updated bundles", () => {
			const out = formatDiff(updated, "markdown", { color: false });
			expect(out).toMatchInlineSnapshot(`
				## Bundle sizes

				| Bundle | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |
				| lib | 1 file(s) | 200B → **200B** (+0B) | gzip: 150B<br>brotli: 120B | - |
				| vendor | 1 file(s) | 300B → **250B** (-50B) | gzip: 210B<br>brotli: 200B | -16.67% |
			`);
		});

		it("formats added bundle", () => {
			const outMd = formatDiff(added, "markdown", { color: false });
			expect(outMd).toMatchInlineSnapshot(`
				## Bundle sizes

				| Bundle | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| new (added) | 1 file(s) | N/A → **150B** | gzip: 100B<br>brotli: 80B | +0.00% |
			`);
		});

		it("formats removed bundle", () => {
			const outMd = formatDiff(removed, "markdown", { color: false });
			expect(outMd).toMatchInlineSnapshot(`
				## Bundle sizes

				| Bundle | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| old (removed) | N/A | 200B → N/A | N/A | N/A |
			`);
		});
	});

	describe("text", () => {
		it("formats updated bundles", () => {
			const out = formatDiff(updated, "text", { color: false });
			expect(out).toMatchInlineSnapshot(`
				app: files=2 (+0), size=100B (+10B), gzip=80B (+5B), brotli=70B (-2B)
				lib: files=1 (+0), size=200B (+0B), gzip=150B (+0B), brotli=120B (+0B)
				vendor: files=1 (+0), size=250B (-50B), gzip=210B (-40B), brotli=200B (-30B)
			`);
		});

		it("formats added bundle", () => {
			const outText = formatDiff(added, "text", { color: false });
			expect(outText).toMatchInlineSnapshot(`
				new: files=1 (+1), size=150B (+150B), gzip=100B (+100B), brotli=80B (+80B)
			`);
		});

		it("formats removed bundle", () => {
			const outText = formatDiff(removed, "text", { color: false });
			expect(outText).toMatchInlineSnapshot(`
				old: removed
			`);
		});
	});
});
