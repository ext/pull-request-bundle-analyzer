import { describe, expect, it } from "vitest";
import { formatPercent } from "./format-percent.ts";

describe("formatPercent()", () => {
	it("should return +0.00% when old size is zero", () => {
		expect(formatPercent({ oldSize: 0, newSize: 1024, difference: 1024 })).toBe("+0.00%");
	});

	it("should return '-' when sizes are unchanged", () => {
		expect(formatPercent({ oldSize: 1000, newSize: 1000, difference: 0 })).toBe("-");
	});

	it("should return positive percent with + prefix when increased", () => {
		expect(formatPercent({ oldSize: 100, newSize: 150, difference: 50 })).toBe("+50.00%");
	});

	it("should return negative percent when decreased", () => {
		expect(formatPercent({ oldSize: 200, newSize: 100, difference: -100 })).toBe("-50.00%");
	});
});
