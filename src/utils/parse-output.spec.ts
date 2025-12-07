import { describe, expect, it } from "vitest";
import { parseOutput } from "./parse-output.ts";

const paramName = "--mock-parameter";

describe("parseOutput()", () => {
	it("should parse a valid format:key string", () => {
		expect(parseOutput("json:report", { paramName, requireFormat: true })).toEqual({
			format: "json",
			key: "report",
		});
		expect(parseOutput("markdown:summary", { paramName, requireFormat: true })).toEqual({
			format: "markdown",
			key: "summary",
		});
		expect(parseOutput("text:out", { paramName, requireFormat: true })).toEqual({
			format: "text",
			key: "out",
		});
	});

	it("should throw for non-string values", () => {
		expect(() =>
			parseOutput(null as unknown as string, { paramName, requireFormat: true }),
		).toThrow("--mock-parameter must be a string in the form 'format:key'");
		expect(() => parseOutput({} as unknown as string, { paramName, requireFormat: true })).toThrow(
			"--mock-parameter must be a string in the form 'format:key'",
		);
	});

	it("should throw when missing the ':' separator", () => {
		expect(() => parseOutput("json", { paramName, requireFormat: true })).toThrow(
			"--mock-parameter must be in the form 'format:key'",
		);
	});

	it("should throw for unsupported formats", () => {
		expect(() => parseOutput("xml:foo", { paramName, requireFormat: true })).toThrow(
			/Invalid format for --mock-parameter: xml/,
		);
	});

	it("should throw when the key is empty", () => {
		expect(() => parseOutput("json:", { paramName, requireFormat: true })).toThrow(
			"--mock-parameter key must not be empty",
		);
	});
});
