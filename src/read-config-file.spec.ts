import nodefs from "node:fs/promises";
import { Volume } from "memfs";
import { describe, expect, it } from "vitest";
import { readConfigFile } from "./read-config-file.ts";

function createVolume(configObject: unknown): { fs: typeof nodefs; path: string } {
	const vol = Volume.fromJSON({
		"/project/config.json": JSON.stringify(configObject),
	});
	const fs = vol.promises as unknown as typeof nodefs;
	return { fs, path: "/project/config.json" };
}

describe("readConfigFile()", () => {
	it("should parse and normalize valid config", async () => {
		const { fs, path } = createVolume({
			artifacts: [{ id: "app", name: "app", include: "dist/*.js" }],
		});
		const result = await readConfigFile(path, { fs });
		expect(result).toEqual({
			artifacts: [
				{
					id: "app",
					name: "app",
					include: ["dist/*.js"],
					exclude: [],
					compression: ["gzip", "brotli"],
				},
			],
		});
	});

	it("should return empty artifacts when omitted", async () => {
		const { fs, path } = createVolume({});
		const result = await readConfigFile(path, { fs });
		expect(result).toEqual({ artifacts: [] });
	});

	it("should normalize include string to array", async () => {
		const { fs, path } = createVolume({
			artifacts: [{ id: "a", name: "a", include: "dist/*.js" }],
		});
		const result = await readConfigFile(path, { fs });
		expect(result.artifacts[0].include).toEqual(["dist/*.js"]);
	});

	it("should preserve include when array", async () => {
		const { fs, path } = createVolume({
			artifacts: [{ id: "b", name: "b", include: ["a", "b"] }],
		});
		const result = await readConfigFile(path, { fs });
		expect(result.artifacts[0].include).toEqual(["a", "b"]);
	});

	it("should default exclude to empty array", async () => {
		const { fs, path } = createVolume({
			artifacts: [{ id: "c", name: "c", include: "dist/*.js" }],
		});
		const result = await readConfigFile(path, { fs });
		expect(result.artifacts[0].exclude).toEqual([]);
	});

	it("should preserve compression algorithm when provided", async () => {
		const { fs, path } = createVolume({
			artifacts: [
				{ id: "single", name: "single", include: "dist/*.js", compression: ["gzip"] },
				{ id: "none", name: "none", include: "dist/*.js", compression: [] },
			],
		});
		const result = await readConfigFile(path, { fs });
		expect(result.artifacts[0].compression).toEqual(["gzip"]);
		expect(result.artifacts[1].compression).toEqual([]);
	});

	it("should accept single compression string and normalize to array", async () => {
		const { fs, path } = createVolume({
			artifacts: [
				{ id: "single-str", name: "single-str", include: "dist/*.js", compression: "gzip" },
			],
		});
		const result = await readConfigFile(path, { fs });
		expect(result.artifacts[0].compression).toEqual(["gzip"]);
	});

	it("should accept false to disable compression and normalize to empty array", async () => {
		const { fs, path } = createVolume({
			artifacts: [{ id: "disabled", name: "disabled", include: "dist/*.js", compression: false }],
		});
		const result = await readConfigFile(path, { fs });
		expect(result.artifacts[0].compression).toEqual([]);
	});

	it("should reject invalid compression keywords", async () => {
		const { fs, path } = createVolume({
			artifacts: [{ id: "bad", name: "bad", include: "x", compression: ["invalid"] }],
		});
		await expect(readConfigFile(path, { fs })).rejects.toThrowErrorMatchingInlineSnapshot(
			`
			[Error: Config schema validation failed: data/artifacts/0/compression must be boolean
			data/artifacts/0/compression must be equal to constant
			data/artifacts/0/compression must be string
			data/artifacts/0/compression must be equal to one of the allowed values
			data/artifacts/0/compression/0 must be equal to one of the allowed values
			data/artifacts/0/compression must match a schema in anyOf]
		`,
		);
	});

	it("should reject boolean true for compression", async () => {
		const { fs, path } = createVolume({
			artifacts: [{ id: "bad-true", name: "bad-true", include: "x", compression: true }],
		});
		await expect(readConfigFile(path, { fs })).rejects.toThrowErrorMatchingInlineSnapshot(
			`
			[Error: Config schema validation failed: data/artifacts/0/compression must be equal to constant
			data/artifacts/0/compression must be string
			data/artifacts/0/compression must be equal to one of the allowed values
			data/artifacts/0/compression must be array
			data/artifacts/0/compression must match a schema in anyOf]
		`,
		);
	});

	it("should reject mixed compression array with invalid entry", async () => {
		const { fs, path } = createVolume({
			artifacts: [
				{ id: "bad-mix", name: "bad-mix", include: "x", compression: ["gzip", "invalid"] },
			],
		});
		await expect(readConfigFile(path, { fs })).rejects.toThrowErrorMatchingInlineSnapshot(
			`
			[Error: Config schema validation failed: data/artifacts/0/compression must be boolean
			data/artifacts/0/compression must be equal to constant
			data/artifacts/0/compression must be string
			data/artifacts/0/compression must be equal to one of the allowed values
			data/artifacts/0/compression/1 must be equal to one of the allowed values
			data/artifacts/0/compression must match a schema in anyOf]
		`,
		);
	});

	it("should throw when an artifact is missing id", async () => {
		const { fs, path } = createVolume({ artifacts: [{ name: "no-id", include: "dist/*.js" }] });
		const p = readConfigFile(path, { fs });
		await expect(p).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Config schema validation failed: data/artifacts/0 must have required property 'id']`,
		);
	});

	it("should throw when duplicate ids are present", async () => {
		const { fs, path } = createVolume({
			artifacts: [
				{ id: "dup", name: "one", include: "dist/*.js" },
				{ id: "dup", name: "two", include: "dist/*.js" },
			],
		});
		await expect(readConfigFile(path, { fs })).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Duplicate artifact id "dup" found in config]`,
		);
	});

	it("should throw when name is missing", async () => {
		const { fs, path } = createVolume({ artifacts: [{ id: "no-name", include: "dist/*.js" }] });
		const p = readConfigFile(path, { fs });
		await expect(p).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Config schema validation failed: data/artifacts/0 must have required property 'name']`,
		);
	});

	it("should fail for empty id or name", async () => {
		const { fs, path } = createVolume({ artifacts: [{ id: "", name: "nm", include: "x" }] });
		await expect(readConfigFile(path, { fs })).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Config schema validation failed: data/artifacts/0/id must NOT have fewer than 1 characters]`,
		);
		const { fs: fs2, path: path2 } = createVolume({
			artifacts: [{ id: "ok", name: "", include: "x" }],
		});
		await expect(readConfigFile(path2, { fs: fs2 })).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Config schema validation failed: data/artifacts/0/name must NOT have fewer than 1 characters]`,
		);
	});

	it("should reject unknown top-level properties", async () => {
		const { fs, path } = createVolume({ artifacts: [], extra: true });
		await expect(readConfigFile(path, { fs })).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Config schema validation failed: data must NOT have additional properties]`,
		);
	});

	it("should surface JSON parse errors", async () => {
		const vol = Volume.fromJSON({ "/project/config.json": "{ invalid-json" });
		const fs = vol.promises as unknown as typeof nodefs;
		await expect(
			readConfigFile("/project/config.json", { fs }),
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[SyntaxError: Expected property name or '}' in JSON at position 2 (line 1 column 3)]`,
		);
	});

	it("should propagate fs read errors from injected fs", async () => {
		const fakeFs = {
			readFile: async () => {
				throw new Error("ENOENT: no such file");
			},
		} as unknown as typeof nodefs;
		await expect(
			readConfigFile("does-not-exist.json", { fs: fakeFs }),
		).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: ENOENT: no such file]`);
	});
});
