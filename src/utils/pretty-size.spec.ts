import { describe, expect, it } from "vitest";
import { prettySize } from "./pretty-size.ts";

describe("prettySize()", () => {
	it("should return integer bytes for sizes < 1024", () => {
		expect(prettySize(0)).toBe("0B");
		expect(prettySize(1)).toBe("1B");
		expect(prettySize(100)).toBe("100B");
		expect(prettySize(1023)).toBe("1023B");
	});

	it("should format kilobytes with one decimal", () => {
		expect(prettySize(1024)).toBe("1.0KiB");
		expect(prettySize(1536)).toBe("1.5KiB");
		expect(prettySize(2048)).toBe("2.0KiB");
	});

	it("should format megabytes with one decimal", () => {
		const mb = 1024 * 1024;
		expect(prettySize(mb)).toBe("1.0MiB");
		expect(prettySize(mb + mb / 2)).toBe("1.5MiB");
	});
});
