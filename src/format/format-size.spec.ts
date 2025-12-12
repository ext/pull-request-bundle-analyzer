import { describe, expect, it } from "vitest";
import { formatSize } from "./format-size.ts";

describe("formatSize()", () => {
	it("formats markdown style without color", () => {
		const size = { oldSize: 0, newSize: 1024, difference: 1024 };
		expect(formatSize("gzip", size, { style: "markdown" })).toBe("gzip: 1.0KiB");
	});

	it("formats text style with positive diff", () => {
		const size = { oldSize: 512, newSize: 1024, difference: 512 };
		expect(formatSize("gzip", size, { style: "text" })).toBe("gzip=1.0KiB (+512B)");
	});

	it("formats text style with negative diff", () => {
		const size = { oldSize: 2048, newSize: 1024, difference: -1024 };
		expect(formatSize("gzip", size, { style: "text" })).toBe("gzip=1.0KiB (-1.0KiB)");
	});

	it("applies colorize only to the numeric portion", () => {
		const size = { oldSize: 512, newSize: 1024, difference: 512 };
		const colorize = (s: string): string => `*${s}*`;
		expect(formatSize("gzip", size, { style: "markdown", colorize })).toBe("gzip: *1.0KiB*");
		expect(formatSize("gzip", size, { style: "text", colorize })).toBe("gzip=*1.0KiB* (+512B)");
	});
});
