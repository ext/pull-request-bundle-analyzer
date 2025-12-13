import { describe, expect, it } from "vitest";
import { parseOutput } from "./parse-output.ts";

const paramName = "--mock-parameter";

describe("parseOutput()", () => {
	it("should parse a valid format:key string", () => {
		const result1 = parseOutput("json:report", { paramName, requireFormat: true });
		const result2 = parseOutput("markdown:summary", { paramName, requireFormat: true });
		const result3 = parseOutput("text:out", { paramName, requireFormat: true });
		expect(result1).toEqual({
			format: "json",
			key: "report",
		});
		expect(result2).toEqual({
			format: "markdown",
			key: "summary",
		});
		expect(result3).toEqual({
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

	it("should allow missing format when requireFormat is false", () => {
		const result = parseOutput("report", { paramName, requireFormat: false });
		expect(result).toEqual({
			format: undefined,
			key: "report",
		});
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
