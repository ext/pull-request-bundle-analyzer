import { describe, expect, it } from "vitest";
import { Config } from "./index.ts";
import { normalizeConfig } from "./normalize-config.ts";

describe("normalizeConfig()", () => {
	it("should handle empty config", () => {
		const config: Config = {};
		expect(normalizeConfig(config)).toEqual({ bundles: [] });
	});

	it("should handle empty bundle", () => {
		const config: Config = {
			bundles: [{ id: "empty", name: "empty" }],
		};
		expect(normalizeConfig(config)).toEqual({
			bundles: [{ id: "empty", name: "empty", include: [], exclude: [] }],
		});
	});

	it("should normalize include/exclude strings to array", () => {
		const config: Config = {
			bundles: [{ id: "test", name: "test", include: "dist/*.js", exclude: "dist/foo.js" }],
		};
		expect(normalizeConfig(config)).toEqual({
			bundles: [{ id: "test", name: "test", include: ["dist/*.js"], exclude: ["dist/foo.js"] }],
		});
	});

	it("should preserve include/exclude arrays", () => {
		const config: Config = {
			bundles: [
				{
					id: "test",
					name: "test",
					include: ["dist/*.js"],
					exclude: ["dist/foo.js", "dist/bar.js"],
				},
			],
		};
		expect(normalizeConfig(config)).toEqual({
			bundles: [
				{
					id: "test",
					name: "test",
					include: ["dist/*.js"],
					exclude: ["dist/foo.js", "dist/bar.js"],
				},
			],
		});
	});
});
