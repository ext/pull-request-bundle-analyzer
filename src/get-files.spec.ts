import nodefs from "node:fs/promises";
import { Volume } from "memfs";
import { describe, expect, it } from "vitest";
import { type NormalizedBundleConfig } from "./config/index.ts";
import { getFiles } from "./get-files.ts";

const cwd = "/";

describe("getFiles", () => {
	it("should return empty array when include and exclude are both empty", async () => {
		const vol = Volume.fromJSON({ "/dist/index.js": "" });
		const fs = vol.promises as unknown as typeof nodefs;
		const bundle: Pick<NormalizedBundleConfig, "include" | "exclude"> = {
			include: [],
			exclude: [],
		};
		const files = await getFiles({ bundle, cwd, fs });
		expect(files).toEqual([]);
	});

	it("should return files matched by include", async () => {
		const vol = Volume.fromJSON({ "/dist/index.js": "" });
		const fs = vol.promises as unknown as typeof nodefs;
		const bundle: Pick<NormalizedBundleConfig, "include" | "exclude"> = {
			include: ["dist/index.js", "dist/foo.js"],
			exclude: [],
		};
		const files = await getFiles({ bundle, cwd, fs });
		expect(files).toEqual(["dist/index.js"]);
	});

	it("should return files matched by include (glob)", async () => {
		const vol = Volume.fromJSON({ "/dist/index.js": "", "/dist/foo.js": "" });
		const fs = vol.promises as unknown as typeof nodefs;
		const bundle: Pick<NormalizedBundleConfig, "include" | "exclude"> = {
			include: ["dist/*.js"],
			exclude: [],
		};
		const files = await getFiles({ bundle, cwd, fs });
		expect(files).toEqual(["dist/foo.js", "dist/index.js"]);
	});

	it("should exclude files matched by exclude", async () => {
		const vol = Volume.fromJSON({ "/dist/index.js": "", "/dist/foo.js": "" });
		const fs = vol.promises as unknown as typeof nodefs;
		const bundle: Pick<NormalizedBundleConfig, "include" | "exclude"> = {
			include: ["dist/*.js"],
			exclude: ["dist/foo.js"],
		};
		const files = await getFiles({ bundle, cwd, fs });
		expect(files).toEqual(["dist/index.js"]);
	});
});
