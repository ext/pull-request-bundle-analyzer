import util, { stripVTControlCharacters } from "node:util";
import { describe, expect, it, vi } from "vitest";
import {
	allChanged,
	fileChanges,
	gzipOnly,
	mixedChanges,
	mixedCompression,
	multipleUnchanged,
	noCompression,
	singleAdded,
	singleAddedNoCompression,
	singleRemoved,
	singleRemovedNoCompression,
	unchangedNoCompression,
	unchangedOnly,
} from "./__fixtures__/index.ts";
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

describe("formatDiff()", () => {
	describe("json", () => {
		it("should format updated artifacts", () => {
			const out = formatDiff(mixedChanges, "json");
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(mixedChanges);
		});

		it("should format added artifact", () => {
			const outJson = formatDiff(singleAdded, "json");
			const parsedJson = JSON.parse(outJson);
			expect(parsedJson).toEqual(singleAdded);
		});

		it("should format removed artifact", () => {
			const outJson = formatDiff(singleRemoved, "json");
			const parsedJson = JSON.parse(outJson);
			expect(parsedJson).toEqual(singleRemoved);
		});

		it("should format artifacts with only one algorithm enabled", () => {
			const out = formatDiff(gzipOnly, "json");
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(gzipOnly);
		});

		it("should format artifacts with all algorithms disabled", () => {
			const out = formatDiff(noCompression, "json");
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(noCompression);
		});

		it("should format artifacts with mixed algorithms", () => {
			const out = formatDiff(mixedCompression, "json");
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(mixedCompression);
		});

		it("should format artifact with removed file", () => {
			const out = formatDiff(fileChanges, "json");
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(fileChanges);
		});

		it("should format added artifact with no compression", () => {
			const out = formatDiff(singleAddedNoCompression, "json");
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(singleAddedNoCompression);
		});

		it("should format removed artifact with no compression", () => {
			const out = formatDiff(singleRemovedNoCompression, "json");
			const parsed = JSON.parse(out);
			expect(parsed).toEqual(singleRemovedNoCompression);
		});
	});

	describe("markdown", () => {
		it("should format updated artifacts", () => {
			const out = formatDiff(mixedChanges, "markdown");
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |
				| lib | 1 file(s) | 200B | gzip: 150B<br>brotli: 120B | - |
				| vendor | 1 file(s) | 300B → **250B** (-50B) | gzip: 210B<br>brotli: 200B | -16.67% |
			`);
		});

		it("should format added artifact", () => {
			const outMd = formatDiff(singleAdded, "markdown");
			expect(outMd).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| new (added) | 1 file(s) | N/A → **150B** | gzip: 100B<br>brotli: 80B | +0.00% |
			`);
		});

		it("should format removed artifact", () => {
			const outMd = formatDiff(singleRemoved, "markdown");
			expect(outMd).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| old (removed) | N/A | 200B → N/A | N/A | N/A |
			`);
		});

		it("should format artifacts with only one algorithm enabled", () => {
			const out = formatDiff(gzipOnly, "markdown");
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| one-a | 0 file(s) | 90B → **100B** (+10B) | gzip: 80B | +11.11% |
				| one-b | 0 file(s) | 50B → **60B** (+10B) | gzip: 45B | +20.00% |
			`);
		});

		it("should format artifacts with all algorithms disabled", () => {
			const out = formatDiff(noCompression, "markdown");
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Change |
				|---|---|---:|---:|
				| none-a | 0 file(s) | 90B → **100B** (+10B) | +11.11% |
				| none-b | 0 file(s) | 50B → **60B** (+10B) | +20.00% |
			`);
		});

		it("should format artifacts with mixed algorithms", () => {
			const out = formatDiff(mixedCompression, "markdown");
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| all-enabled | 0 file(s) | 120B → **130B** (+10B) | gzip: 95B<br>brotli: 85B | +8.33% |
				| brotli-only | 0 file(s) | 70B → **75B** (+5B) | brotli: 62B | +7.14% |
				| all-disabled | 0 file(s) | 30B → **40B** (+10B) | N/A | +33.33% |
			`);
		});

		it("should format artifact with removed file", () => {
			const out = formatDiff(fileChanges, "markdown");
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Change |
				|---|---|---:|---:|
				| removed-files | 1 file(s) | 120B → **110B** (-10B) | -8.33% |
			`);
		});

		it("should format added artifact with no compression (no compressed column)", () => {
			const out = formatDiff(singleAddedNoCompression, "markdown");
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Change |
				|---|---|---:|---:|
				| new-nc (added) | 1 file(s) | N/A → **150B** | +0.00% |
			`);
		});

		it("should format removed artifact with no compression (no compressed column)", () => {
			const out = formatDiff(singleRemovedNoCompression, "markdown");
			expect(out).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Change |
				|---|---|---:|---:|
				| old-nc (removed) | N/A | 200B → N/A | N/A |
			`);
		});

		it("should include header when header is true", () => {
			const out = formatDiff(mixedChanges, "markdown", {
				color: false,
				header: true,
				unchanged: "show",
			});
			expect(out).toContain("## Artifact sizes");
		});

		it("should omit header when header is false", () => {
			const out = formatDiff(mixedChanges, "markdown", {
				color: false,
				header: false,
				unchanged: "show",
			});
			expect(out).not.toContain("## Artifact sizes");
		});
	});

	describe("text", () => {
		it("should format updated artifacts", () => {
			const out = formatDiff(mixedChanges, "text");
			expect(out).toMatchInlineSnapshot(`
				app: files=2 (+0), size=100B (+10B), gzip=80B (+5B), brotli=70B (-2B)

				lib: files=1 (+0), size=200B (+0B), gzip=150B (+0B), brotli=120B (+0B)

				vendor: files=1 (+0), size=250B (-50B), gzip=210B (-40B), brotli=200B (-30B)
			`);
		});

		it("should format added artifact", () => {
			const outText = formatDiff(singleAdded, "text", { color: false, header: true });
			expect(outText).toMatchInlineSnapshot(`
				new: files=1 (+1), size=150B (+150B), gzip=100B (+100B), brotli=80B (+80B)
			`);
		});

		it("should format removed artifact", () => {
			const outText = formatDiff(singleRemoved, "text", { color: false, header: true });
			expect(outText).toMatchInlineSnapshot(`
				old: removed
			`);
		});

		it("should format artifacts with only one algorithm enabled", () => {
			const out = formatDiff(gzipOnly, "text", { color: false, header: true });
			expect(out).toMatchInlineSnapshot(`
				one-a: files=0 (+0), size=100B (+10B), gzip=80B (+5B)

				one-b: files=0 (+0), size=60B (+10B), gzip=45B (+5B)
			`);
		});

		it("should format artifacts with all algorithms disabled", () => {
			const out = formatDiff(noCompression, "text", { color: false, header: true });
			expect(out).toMatchInlineSnapshot(`
				none-a: files=0 (+0), size=100B (+10B)

				none-b: files=0 (+0), size=60B (+10B)
			`);
		});

		it("should format artifacts with mixed algorithms", () => {
			const out = formatDiff(mixedCompression, "text", { color: false, header: true });
			expect(out).toMatchInlineSnapshot(`
				all-enabled: files=0 (+0), size=130B (+10B), gzip=95B (+5B), brotli=85B (+5B)

				brotli-only: files=0 (+0), size=75B (+5B), brotli=62B (+2B)

				all-disabled: files=0 (+0), size=40B (+10B)
			`);
		});

		it("should format artifact with removed file", () => {
			const out = formatDiff(fileChanges, "text", { color: false, header: true });
			expect(out).toMatchInlineSnapshot(`removed-files: files=1 (-1), size=110B (-10B)`);
		});

		it("should format added artifact with no compression (text)", () => {
			const out = formatDiff(singleAddedNoCompression, "text", { color: false, header: true });
			expect(out).toMatchInlineSnapshot(`
				new-nc: files=1 (+1), size=150B (+150B)
			`);
		});

		it("should format removed artifact with no compression (text)", () => {
			const out = formatDiff(singleRemovedNoCompression, "text", { color: false, header: true });
			expect(out).toMatchInlineSnapshot(`
				old-nc: removed
			`);
		});

		it("should colorize output", () => {
			const out = formatDiff(mixedChanges, "text", { color: true, header: true });
			expect(out).toMatchInlineSnapshot(`
				app: files=<cyan>2</cyan> (+0), size=<cyan>100B</cyan> (+10B), gzip=<cyan>80B</cyan> (+5B), brotli=<cyan>70B</cyan> (-2B)

				lib: files=<cyan>1</cyan> (+0), size=<cyan>200B</cyan> (+0B), gzip=<cyan>150B</cyan> (+0B), brotli=<cyan>120B</cyan> (+0B)

				vendor: files=<cyan>1</cyan> (+0), size=<cyan>250B</cyan> (-50B), gzip=<cyan>210B</cyan> (-40B), brotli=<cyan>200B</cyan> (-30B)
			`);
		});
	});

	describe("unchanged option", () => {
		it("should hide unchanged artifacts in markdown format", () => {
			const disabled = formatDiff(mixedChanges, "markdown", { unchanged: "show" });
			const enabled = formatDiff(mixedChanges, "markdown", { unchanged: "hide" });
			expect(disabled).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |
				| lib | 1 file(s) | 200B | gzip: 150B<br>brotli: 120B | - |
				| vendor | 1 file(s) | 300B → **250B** (-50B) | gzip: 210B<br>brotli: 200B | -16.67% |
			`);
			expect(enabled).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build (artifacts with unchanged sizes omitted).

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |
				| vendor | 1 file(s) | 300B → **250B** (-50B) | gzip: 210B<br>brotli: 200B | -16.67% |

				*1 artifact omitted*
			`);
		});

		it("should hide unchanged artifacts in text format", () => {
			const disabled = formatDiff(mixedChanges, "text", { unchanged: "show" });
			const enabled = formatDiff(mixedChanges, "text", { unchanged: "hide" });
			expect(disabled).toMatchInlineSnapshot(`
				app: files=2 (+0), size=100B (+10B), gzip=80B (+5B), brotli=70B (-2B)

				lib: files=1 (+0), size=200B (+0B), gzip=150B (+0B), brotli=120B (+0B)

				vendor: files=1 (+0), size=250B (-50B), gzip=210B (-40B), brotli=200B (-30B)
			`);
			expect(enabled).toMatchInlineSnapshot(`
				app: files=2 (+0), size=100B (+10B), gzip=80B (+5B), brotli=70B (-2B)

				vendor: files=1 (+0), size=250B (-50B), gzip=210B (-40B), brotli=200B (-30B)
			`);
		});

		it("should not affect JSON format", () => {
			const disabled = formatDiff(mixedChanges, "json", { unchanged: "show" });
			const enabled = formatDiff(mixedChanges, "json", { unchanged: "hide" });
			expect(enabled).toBe(disabled);
		});

		it("should show message when no artifacts are changed", () => {
			const result = formatDiff(unchangedOnly, "markdown", { unchanged: "hide" });
			expect(result).toMatchInlineSnapshot(`
				## Artifact sizes

				No artifact size changes in this build.
			`);
		});

		it("should not show trailer when no artifacts are omitted", () => {
			const result = formatDiff(allChanged, "markdown", { unchanged: "hide" });
			expect(result).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |
				| vendor | 1 file(s) | 300B → **250B** (-50B) | gzip: 210B<br>brotli: 200B | -16.67% |
			`);
		});

		it("should show plural message when multiple artifacts are omitted", () => {
			const result = formatDiff(multipleUnchanged, "markdown", { unchanged: "hide" });
			expect(result).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build (artifacts with unchanged sizes omitted).

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |

				*2 artifacts omitted*
			`);
		});

		it("should show unchanged artifacts in details section when unchanged is 'collapse'", () => {
			const result = formatDiff(mixedChanges, "markdown", { unchanged: "collapse" });
			expect(result).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build (unchanged artifacts collapsed below).

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |
				| vendor | 1 file(s) | 300B → **250B** (-50B) | gzip: 210B<br>brotli: 200B | -16.67% |

				*1 artifact collapsed*

				<details>
				<summary>1 unchanged artifact</summary>

				| Artifact | Files | Size | Compressed |
				|---|---|---:|---:|
				| lib | 1 file(s) | 200B | gzip: 150B<br>brotli: 120B |

				</details>
			`);
		});

		it("should show multiple unchanged artifacts in details section", () => {
			const result = formatDiff(multipleUnchanged, "markdown", { unchanged: "collapse" });
			expect(result).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build (unchanged artifacts collapsed below).

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |

				*2 artifacts collapsed*

				<details>
				<summary>2 unchanged artifacts</summary>

				| Artifact | Files | Size | Compressed |
				|---|---|---:|---:|
				| lib | 1 file(s) | 200B | gzip: 150B<br>brotli: 120B |
				| vendor | 1 file(s) | 300B | gzip: 250B<br>brotli: 230B |

				</details>
			`);
		});

		it("should show details without compression when unchanged artifacts have no compression", () => {
			const result = formatDiff(unchangedNoCompression, "markdown", { unchanged: "collapse" });
			expect(result).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build (unchanged artifacts collapsed below).

				| Artifact | Files | Size | Change |
				|---|---|---:|---:|
				| app | 1 file(s) | 90B → **100B** (+10B) | +11.11% |

				*1 artifact collapsed*

				<details>
				<summary>1 unchanged artifact</summary>

				| Artifact | Files | Size |
				|---|---|---:|
				| lib | 1 file(s) | 200B |

				</details>
			`);
		});

		it("should not show details section when all artifacts are changed", () => {
			const result = formatDiff(allChanged, "markdown", { unchanged: "collapse" });
			expect(result).toMatchInlineSnapshot(`
				## Artifact sizes

				Artifact sizes in this build.

				| Artifact | Files | Size | Compressed | Change |
				|---|---|---:|---:|---:|
				| app | 2 file(s) | 90B → **100B** (+10B) | gzip: 80B<br>brotli: 70B | +11.11% |
				| vendor | 1 file(s) | 300B → **250B** (-50B) | gzip: 210B<br>brotli: 200B | -16.67% |
			`);
		});

		it("should return empty string when no header and no artifacts to show", () => {
			const result = formatDiff(unchangedOnly, "markdown", { unchanged: "hide", header: false });
			expect(result).toBe("");
		});
	});
});
