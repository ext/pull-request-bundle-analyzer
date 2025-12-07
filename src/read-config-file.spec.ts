import nodefs from "node:fs/promises";
import { Volume } from "memfs";
import { describe, expect, it } from "vitest";
import { readConfigFile } from "./read-config-file.ts";

describe("readConfigFile()", () => {
	it("parses and normalizes config with ids", async () => {
		const vol = Volume.fromJSON({
			"project/config.json": JSON.stringify({
				bundles: [{ id: "app", name: "app", include: "dist/*.js" }],
			}),
		});
		const fs = vol.promises as unknown as typeof nodefs;

		const result = await readConfigFile("project/config.json", fs);
		expect(result).toEqual({
			bundles: [{ id: "app", name: "app", include: ["dist/*.js"], exclude: [] }],
		});
	});

	it("throws when duplicate ids are present", async () => {
		const vol = Volume.fromJSON({
			"project/config.json": JSON.stringify({
				bundles: [
					{ id: "dup", name: "one", include: "dist/*.js" },
					{ id: "dup", name: "two", include: "dist/*.js" },
				],
			}),
		});
		const fs = vol.promises as unknown as typeof nodefs;

		await expect(readConfigFile("project/config.json", fs)).rejects.toThrow(/Duplicate bundle id/);
	});
});
