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
			bundles: [
				{ id: "empty", name: "empty", include: [], exclude: [], compression: ["gzip", "brotli"] },
			],
		});
	});

	it("should normalize include/exclude strings to array", () => {
		const config: Config = {
			bundles: [{ id: "test", name: "test", include: "dist/*.js", exclude: "dist/foo.js" }],
		};
		expect(normalizeConfig(config)).toEqual({
			bundles: [
				{
					id: "test",
					name: "test",
					include: ["dist/*.js"],
					exclude: ["dist/foo.js"],
					compression: ["gzip", "brotli"],
				},
			],
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
					compression: ["gzip", "brotli"],
				},
			],
		});
	});

	it("should preserve compression array", () => {
		const config: Config = {
			bundles: [{ id: "c2", name: "c2", include: [], exclude: [], compression: ["brotli"] }],
		};
		expect(normalizeConfig(config).bundles[0].compression).toEqual(["brotli"]);
	});

	it("should normalize single compression string to array", () => {
		const config: Config = {
			bundles: [{ id: "c3", name: "c3", include: [], exclude: [], compression: "gzip" }],
		};
		expect(normalizeConfig(config).bundles[0].compression).toEqual(["gzip"]);
	});

	it("should treat false compression as empty array", () => {
		const config: Config = {
			bundles: [{ id: "c4", name: "c4", include: [], exclude: [], compression: false }],
		};
		expect(normalizeConfig(config).bundles[0].compression).toEqual([]);
	});
});
