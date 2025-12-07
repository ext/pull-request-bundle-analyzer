import { Console } from "node:console";
import type nodefs from "node:fs/promises";
import { Volume } from "memfs";
import { WritableStreamBuffer } from "stream-buffers";
import { expect, it } from "vitest";
import { BundleDiff } from "../../src/bundle-diff.ts";
import { BundleSize } from "../../src/bundle-size.ts";
import { analyze, compare } from "../../src/cli.ts";
import { type Config } from "../../src/config/index.ts";

async function createVolume(json: Record<string, string> = {}): Promise<{ fs: typeof nodefs }> {
	const vol = Volume.fromJSON(json);
	const fs = vol.promises as unknown as typeof nodefs;
	await fs.mkdir("/project/dist", { recursive: true });
	await fs.mkdir("/project/temp", { recursive: true });
	return { fs };
}

export function createConsole(): { stream: WritableStreamBuffer; console: Console } {
	const stream = new WritableStreamBuffer();
	const bufConsole = new Console(stream, stream);
	return { stream, console: bufConsole };
}

async function readJsonFile<T = unknown>(fs: typeof nodefs, filePath: string): Promise<T> {
	const content = await fs.readFile(filePath, "utf-8");
	return JSON.parse(content) as T;
}

function makeConfig(): Config {
	return {
		bundles: [
			{
				id: "app",
				name: "app",
				include: "dist/**/*.js",
			},
		],
	};
}

it("reports no differences for identical bundles", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/bundle-config.json": JSON.stringify(makeConfig()),
	});

	/* baseline */
	await fs.writeFile("/project/dist/app.js", "a".repeat(100));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/base.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* current (identical) */
	await fs.writeFile("/project/dist/app.js", "a".repeat(100));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/current.json",
		outputGithub: [],
		format: "json",
		fs,
	});

	/* compare */
	await compare({
		cwd: "/project",
		env: {},
		base: "temp/base.json",
		current: "temp/current.json",
		outputFile: "temp/diff.json",
		outputGithub: [],
		format: "json",
		fs,
	});

	const base = await readJsonFile<BundleSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<BundleSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<BundleDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned bundle counts are correct */
	expect(base).toHaveLength(1);
	expect(current).toHaveLength(1);
	expect(diff).toHaveLength(1);

	/* assert expected filenames are present in the results */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(current[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].oldFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].newFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);

	/* assert sizes are unchanged between base and current */
	expect(diff[0].sizeDiff).toBe(0);
	expect(diff[0].oldSize).toBe(100);
	expect(diff[0].newSize).toBe(100);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("reports size increase when file grows", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/bundle-config.json": JSON.stringify(makeConfig()),
	});

	/* baseline */
	await fs.writeFile("/project/dist/app.js", "x".repeat(100));
	await analyze({
		cwd: "/project",
		configFile: "bundle-config.json",
		outputFile: "temp/base.json",
		outputGithub: [],
		format: "json",
		fs,
		env: {},
		console,
	});

	/* current (bigger) */
	await fs.writeFile("/project/dist/app.js", "x".repeat(160));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/current.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* compare */
	await compare({
		cwd: "/project",
		env: {},
		base: "temp/base.json",
		current: "temp/current.json",
		outputFile: "temp/diff.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	const base = await readJsonFile<BundleSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<BundleSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<BundleDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned bundle counts are correct */
	expect(base).toHaveLength(1);
	expect(current).toHaveLength(1);
	expect(diff).toHaveLength(1);

	/* assert expected filenames are present in the results */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(current[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].oldFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].newFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);

	/* assert sizes reflect the expected growth in the current bundle */
	expect(diff[0].sizeDiff).toBe(60);
	expect(diff[0].oldSize).toBe(100);
	expect(diff[0].newSize).toBe(160);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("detects added file between baseline and current", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/bundle-config.json": JSON.stringify(makeConfig()),
	});

	/* baseline (single file) */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/base.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* current (added vendor.js) */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await fs.writeFile("/project/dist/vendor.js", "v".repeat(30));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/current.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* compare */
	await compare({
		cwd: "/project",
		env: {},
		base: "temp/base.json",
		current: "temp/current.json",
		outputFile: "temp/diff.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	const base = await readJsonFile<BundleSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<BundleSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<BundleDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned bundle counts are correct */
	expect(base).toHaveLength(1);
	expect(current).toHaveLength(1);
	expect(diff).toHaveLength(1);

	/* assert expected filenames are present and vendor.js is detected as added */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(current[0].files).toEqual([
		expect.objectContaining({ filename: "dist/app.js" }),
		expect.objectContaining({ filename: "dist/vendor.js" }),
	]);
	expect(diff[0].oldFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].newFiles).toEqual([
		expect.objectContaining({ filename: "dist/app.js" }),
		expect.objectContaining({ filename: "dist/vendor.js" }),
	]);

	/* assert sizes reflect the added file (increase by vendor size) */
	expect(diff[0].sizeDiff).toBe(30);
	expect(diff[0].oldSize).toBe(50);
	expect(diff[0].newSize).toBe(80);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("detects removed file between baseline and current", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/bundle-config.json": JSON.stringify(makeConfig()),
	});

	/* baseline (app + vendor) */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await fs.writeFile("/project/dist/vendor.js", "v".repeat(30));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/base.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* current (vendor removed) */
	await fs.unlink("/project/dist/vendor.js");
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/current.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* compare */
	await compare({
		cwd: "/project",
		env: {},
		base: "temp/base.json",
		current: "temp/current.json",
		outputFile: "temp/diff.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	const base = await readJsonFile<BundleSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<BundleSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<BundleDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned bundle counts are correct */
	expect(base).toHaveLength(1);
	expect(current).toHaveLength(1);
	expect(diff).toHaveLength(1);

	/* assert filenames: baseline had both, current has only app.js after removal */
	expect(base[0].files).toEqual([
		expect.objectContaining({ filename: "dist/app.js" }),
		expect.objectContaining({ filename: "dist/vendor.js" }),
	]);
	expect(current[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].oldFiles).toEqual([
		expect.objectContaining({ filename: "dist/app.js" }),
		expect.objectContaining({ filename: "dist/vendor.js" }),
	]);
	expect(diff[0].newFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);

	/* assert sizes reflect that vendor.js was removed (decrease by vendor size) */
	expect(diff[0].sizeDiff).toBe(-30);
	expect(diff[0].oldSize).toBe(80);
	expect(diff[0].newSize).toBe(50);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("compares multiple bundles", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/bundle-config.json": JSON.stringify({
			bundles: [
				{ id: "app", name: "app", include: "dist/app/**/*.js" },
				{ id: "lib", name: "lib", include: "dist/lib/**/*.js" },
			],
		}),
	});

	/* baseline */
	await fs.mkdir("/project/dist/app", { recursive: true });
	await fs.mkdir("/project/dist/lib", { recursive: true });
	await fs.writeFile("/project/dist/app/app.js", "a".repeat(100));
	await fs.writeFile("/project/dist/lib/lib.js", "l".repeat(200));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/base.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* current (app +10 bytes, lib -20 bytes) */
	await fs.writeFile("/project/dist/app/app.js", "a".repeat(110));
	await fs.writeFile("/project/dist/lib/lib.js", "l".repeat(180));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/current.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* compare */
	await compare({
		cwd: "/project",
		env: {},
		base: "temp/base.json",
		current: "temp/current.json",
		outputFile: "temp/diff.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	const base = await readJsonFile<BundleSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<BundleSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<BundleDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned bundle counts are correct */
	expect(base).toHaveLength(2);
	expect(current).toHaveLength(2);
	expect(diff).toHaveLength(2);

	/* assert expected filenames for each bundle (nested directory layout) */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);
	expect(current[0].files).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);
	expect(diff[0].oldFiles).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);
	expect(diff[0].newFiles).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);

	/* size diffs */
	function findDiff(arr: BundleDiff[], name: string): BundleDiff {
		const d = arr.find((x) => x.name === name);
		if (!d) throw new Error(`diff not found: ${name}`);
		return d;
	}

	const appDiff = findDiff(diff, "app");
	const libDiff = findDiff(diff, "lib");
	expect(appDiff.sizeDiff).toBe(10);
	expect(appDiff.oldSize).toBe(100);
	expect(appDiff.newSize).toBe(110);
	expect(libDiff.sizeDiff).toBe(-20);
	expect(libDiff.oldSize).toBe(200);
	expect(libDiff.newSize).toBe(180);

	/* snapshots */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("respects exclude patterns in config", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/bundle-config.json": JSON.stringify({
			bundles: [
				{
					id: "app",
					name: "app",
					include: "dist/**/*.js",
					exclude: "dist/vendor.js",
				},
			],
		}),
	});

	/* baseline */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await fs.writeFile("/project/dist/vendor.js", "v".repeat(30));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/base.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* current */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await fs.writeFile("/project/dist/vendor.js", "v".repeat(30));
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/current.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* compare */
	await compare({
		cwd: "/project",
		env: {},
		base: "temp/base.json",
		current: "temp/current.json",
		outputFile: "temp/diff.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	const base = await readJsonFile<BundleSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<BundleSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<BundleDiff[]>(fs, "/project/temp/diff.json");

	/* assert vendor is excluded from results as configured */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(current[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].oldFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].newFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);

	/* assert sizes are unchanged because vendor.js is excluded */
	expect(diff[0].sizeDiff).toBe(0);
	expect(diff[0].oldSize).toBe(50);
	expect(diff[0].newSize).toBe(50);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("handles empty bundles gracefully", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/bundle-config.json": JSON.stringify({
			bundles: [
				{
					id: "empty",
					name: "empty",
					include: "dist/**/*.js",
				},
			],
		}),
	});

	/* baseline (no files) */
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/base.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* current (no files) */
	await analyze({
		cwd: "/project",
		env: {},
		configFile: "bundle-config.json",
		outputFile: "temp/current.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	/* compare */
	await compare({
		cwd: "/project",
		env: {},
		base: "temp/base.json",
		current: "temp/current.json",
		outputFile: "temp/diff.json",
		outputGithub: [],
		format: "json",
		fs,
		console,
	});

	const base = await readJsonFile<BundleSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<BundleSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<BundleDiff[]>(fs, "/project/temp/diff.json");

	/* assert empty bundle handled */
	expect(base).toHaveLength(1);
	expect(current).toHaveLength(1);
	expect(diff).toHaveLength(1);

	/* filenames */
	expect(base[0].files).toEqual([]);
	expect(current[0].files).toEqual([]);

	/* sizes empty */
	expect(diff[0].sizeDiff).toBe(0);
	expect(diff[0].oldSize).toBe(0);
	expect(diff[0].newSize).toBe(0);

	/* snapshots */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});
