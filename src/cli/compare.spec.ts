import { Console } from "node:console";
import type nodefs from "node:fs/promises";
import { Volume } from "memfs";
import { WritableStreamBuffer } from "stream-buffers";
import { expect, it } from "vitest";
import { ArtifactDiff } from "../artifact-diff.ts";
import { type ArtifactSize } from "../artifact-size.ts";
import { type Config } from "../config/index.ts";
import { createParser } from "./cli.ts";

async function createVolume(json: Record<string, string> = {}): Promise<{ fs: typeof nodefs }> {
	const vol = Volume.fromJSON(json);
	const fs = vol.promises as unknown as typeof nodefs;
	await fs.mkdir("/project/dist", { recursive: true });
	await fs.mkdir("/project/temp", { recursive: true });
	return { fs };
}

function createConsole(): { stream: WritableStreamBuffer; console: Console } {
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
		artifacts: [
			{
				id: "app",
				name: "app",
				include: "dist/**/*.js",
			},
		],
	};
}

it("reports no differences for identical artifacts", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify(makeConfig()),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline */
	await fs.writeFile("/project/dist/app.js", "a".repeat(100));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* current (identical) */
	await fs.writeFile("/project/dist/app.js", "a".repeat(100));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-file=temp/diff.json",
	]);

	const base = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<ArtifactDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned artifact counts are correct */
	expect(base).toHaveLength(1);
	expect(current).toHaveLength(1);
	expect(diff).toHaveLength(1);

	/* assert expected filenames are present in the results */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(current[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].oldFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].newFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);

	/* assert sizes are unchanged between base and current */
	expect(diff[0].raw.difference).toBe(0);
	expect(diff[0].raw.oldSize).toBe(100);
	expect(diff[0].raw.newSize).toBe(100);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* should have no console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("detects added artifact via config change", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify({
			artifacts: [{ id: "app", name: "app", include: "dist/app/**/*.js" }],
		}),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline with single artifact (app) */
	await fs.mkdir("/project/dist/app", { recursive: true });
	await fs.writeFile("/project/dist/app/app.js", "a".repeat(100));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* update config to add a second artifact (lib) and write files */
	await fs.mkdir("/project/dist/lib", { recursive: true });
	await fs.writeFile("/project/dist/lib/lib.js", "l".repeat(200));
	await fs.writeFile(
		"/project/artifact-config.json",
		JSON.stringify({
			artifacts: [
				{ id: "app", name: "app", include: "dist/app/**/*.js" },
				{ id: "lib", name: "lib", include: "dist/lib/**/*.js" },
			],
		}),
	);

	/* current with added artifact */
	await fs.writeFile("/project/dist/app/app.js", "a".repeat(100));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-file=temp/diff.json",
	]);

	const base = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<ArtifactDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned artifact counts are correct */
	expect(base).toHaveLength(1);
	expect(current).toHaveLength(2);
	expect(diff).toHaveLength(2);

	/* app should be present in both, lib should be added in current */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);
	const appArtifact = current.find((b) => b.id === "app");
	expect(appArtifact).toBeDefined();
	expect(appArtifact?.files).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);
	const libArtifact = current.find((b) => b.id === "lib");
	expect(libArtifact).toBeDefined();
	expect(libArtifact?.files).toEqual([expect.objectContaining({ filename: "dist/lib/lib.js" })]);

	const libDiff = diff.find((d) => d.id === "lib");
	if (!libDiff) {
		throw new Error("lib diff not found");
	}
	expect(libDiff.status).toBe("added");
	expect(libDiff.raw.oldSize).toBe(0);
	expect(libDiff.raw.newSize).toBeGreaterThan(0);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* should have no console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("detects removed artifact via config change", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify({
			artifacts: [
				{ id: "app", name: "app", include: "dist/app/**/*.js" },
				{ id: "lib", name: "lib", include: "dist/lib/**/*.js" },
			],
		}),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline with two artifacts */
	await fs.mkdir("/project/dist/app", { recursive: true });
	await fs.mkdir("/project/dist/lib", { recursive: true });
	await fs.writeFile("/project/dist/app/app.js", "a".repeat(100));
	await fs.writeFile("/project/dist/lib/lib.js", "l".repeat(200));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* update config to remove lib artifact */
	await fs.writeFile(
		"/project/artifact-config.json",
		JSON.stringify({ artifacts: [{ id: "app", name: "app", include: "dist/app/**/*.js" }] }),
	);

	/* current with removed artifact */
	await fs.writeFile("/project/dist/app/app.js", "a".repeat(100));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-file=temp/diff.json",
	]);

	const base = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<ArtifactDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned artifact counts are correct */
	expect(base).toHaveLength(2);
	expect(current).toHaveLength(1);
	expect(diff).toHaveLength(2);

	const libDiff = diff.find((d) => d.id === "lib");
	if (!libDiff) {
		throw new Error("lib diff not found");
	}
	expect(libDiff.status).toBe("removed");
	expect(libDiff.raw.newSize).toBe(0);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* should have no console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("reports size increase when file grows", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify(makeConfig()),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline */
	await fs.writeFile("/project/dist/app.js", "x".repeat(100));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* current (larger) */
	await fs.writeFile("/project/dist/app.js", "x".repeat(160));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-file=temp/diff.json",
	]);

	const base = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<ArtifactDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned artifact counts are correct */
	expect(base).toHaveLength(1);
	expect(current).toHaveLength(1);
	expect(diff).toHaveLength(1);

	/* assert expected filenames are present in the results */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(current[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].oldFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].newFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);

	/* assert sizes reflect the expected growth in the current artifact */
	expect(diff[0].raw.difference).toBe(60);
	expect(diff[0].raw.oldSize).toBe(100);
	expect(diff[0].raw.newSize).toBe(160);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* should have no console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("detects added file between baseline and current", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify(makeConfig()),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline (single file) */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* current (with added file) */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await fs.writeFile("/project/dist/vendor.js", "v".repeat(30));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-file=temp/diff.json",
	]);

	const base = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<ArtifactDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned artifact counts are correct */
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
	expect(diff[0].raw.difference).toBe(30);
	expect(diff[0].raw.oldSize).toBe(50);
	expect(diff[0].raw.newSize).toBe(80);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* should have no console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("detects removed file between baseline and current", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify(makeConfig()),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline (two files) */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await fs.writeFile("/project/dist/vendor.js", "v".repeat(30));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* current (file removed) */
	await fs.unlink("/project/dist/vendor.js");
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-file=temp/diff.json",
	]);

	const base = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<ArtifactDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned artifact counts are correct */
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
	expect(diff[0].raw.difference).toBe(-30);
	expect(diff[0].raw.oldSize).toBe(80);
	expect(diff[0].raw.newSize).toBe(50);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* should have no console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("compares multiple artifacts", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify({
			artifacts: [
				{ id: "app", name: "app", include: "dist/app/**/*.js" },
				{ id: "lib", name: "lib", include: "dist/lib/**/*.js" },
			],
		}),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline */
	await fs.mkdir("/project/dist/app", { recursive: true });
	await fs.mkdir("/project/dist/lib", { recursive: true });
	await fs.writeFile("/project/dist/app/app.js", "a".repeat(100));
	await fs.writeFile("/project/dist/lib/lib.js", "l".repeat(200));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* current (app +10 bytes, lib -20 bytes) */
	await fs.writeFile("/project/dist/app/app.js", "a".repeat(110));
	await fs.writeFile("/project/dist/lib/lib.js", "l".repeat(180));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-file=temp/diff.json",
	]);

	const base = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<ArtifactDiff[]>(fs, "/project/temp/diff.json");

	/* assert returned artifact counts are correct */
	expect(base).toHaveLength(2);
	expect(current).toHaveLength(2);
	expect(diff).toHaveLength(2);

	/* assert expected filenames for each artifact (nested directory layout) */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);
	expect(current[0].files).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);
	expect(diff[0].oldFiles).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);
	expect(diff[0].newFiles).toEqual([expect.objectContaining({ filename: "dist/app/app.js" })]);

	/* helper to find specific artifacts by name */
	function findDiff(arr: ArtifactDiff[], name: string): ArtifactDiff {
		const d = arr.find((diff) => diff.name === name);
		if (!d) {
			throw new Error(`diff not found: ${name}`);
		}
		return d;
	}

	/* size diffs */
	const appDiff = findDiff(diff, "app");
	const libDiff = findDiff(diff, "lib");
	expect(appDiff.raw.difference).toBe(10);
	expect(appDiff.raw.oldSize).toBe(100);
	expect(appDiff.raw.newSize).toBe(110);
	expect(libDiff.raw.difference).toBe(-20);
	expect(libDiff.raw.oldSize).toBe(200);
	expect(libDiff.raw.newSize).toBe(180);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* should have no console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("respects exclude patterns in config", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify({
			artifacts: [
				{
					id: "app",
					name: "app",
					include: "dist/**/*.js",
					exclude: "dist/vendor.js",
				},
			],
		}),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await fs.writeFile("/project/dist/vendor.js", "v".repeat(30));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* current */
	await fs.writeFile("/project/dist/app.js", "1".repeat(50));
	await fs.writeFile("/project/dist/vendor.js", "v".repeat(30));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-file=temp/diff.json",
	]);

	const base = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<ArtifactDiff[]>(fs, "/project/temp/diff.json");

	/* assert vendor is excluded from results as configured */
	expect(base[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(current[0].files).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].oldFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);
	expect(diff[0].newFiles).toEqual([expect.objectContaining({ filename: "dist/app.js" })]);

	/* assert sizes are unchanged because vendor.js is excluded */
	expect(diff[0].raw.difference).toBe(0);
	expect(diff[0].raw.oldSize).toBe(50);
	expect(diff[0].raw.newSize).toBe(50);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* should have no console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});

it("handles empty artifacts gracefully", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify({
			artifacts: [
				{
					id: "empty",
					name: "empty",
					include: "nonexistent/**/*.js",
				},
			],
		}),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline (no matching files) */
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* current (no matching files) */
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-file=temp/diff.json",
	]);

	const base = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/base.json");
	const current = await readJsonFile<ArtifactSize[]>(fs, "/project/temp/current.json");
	const diff = await readJsonFile<ArtifactDiff[]>(fs, "/project/temp/diff.json");

	/* assert empty artifacts are handled correctly */
	expect(base).toHaveLength(1);
	expect(current).toHaveLength(1);
	expect(diff).toHaveLength(1);

	/* filenames */
	expect(base[0].files).toEqual([]);
	expect(current[0].files).toEqual([]);

	/* sizes empty */
	expect(diff[0].raw.difference).toBe(0);
	expect(diff[0].raw.oldSize).toBe(0);
	expect(diff[0].raw.newSize).toBe(0);

	/* snapshot results for regression checks */
	expect(base).toMatchSnapshot("base");
	expect(current).toMatchSnapshot("current");
	expect(diff).toMatchSnapshot("compare");

	/* should have no console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`false`);
});
