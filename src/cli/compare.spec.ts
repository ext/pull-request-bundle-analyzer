import { expect, it } from "vitest";
import { ArtifactDiff } from "../artifact-diff.ts";
import { type ArtifactSize } from "../artifact-size.ts";
import { readJsonFile } from "../utils/index.ts";
import { createParser } from "./cli.ts";
import { createConsole, createVolume, makeConfig } from "./test-helpers.ts";

it("should report no differences for identical artifacts", async () => {
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

	const base = await readJsonFile<ArtifactSize[]>("/project/temp/base.json", { fs });
	const current = await readJsonFile<ArtifactSize[]>("/project/temp/current.json", { fs });
	const diff = await readJsonFile<ArtifactDiff[]>("/project/temp/diff.json", { fs });

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

it("should detect added artifact via config change", async () => {
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

	const base = await readJsonFile<ArtifactSize[]>("/project/temp/base.json", { fs });
	const current = await readJsonFile<ArtifactSize[]>("/project/temp/current.json", { fs });
	const diff = await readJsonFile<ArtifactDiff[]>("/project/temp/diff.json", { fs });

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

it("should detect removed artifact via config change", async () => {
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

	const base = await readJsonFile<ArtifactSize[]>("/project/temp/base.json", { fs });
	const current = await readJsonFile<ArtifactSize[]>("/project/temp/current.json", { fs });
	const diff = await readJsonFile<ArtifactDiff[]>("/project/temp/diff.json", { fs });

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

it("should report size increase when file grows", async () => {
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

	const base = await readJsonFile<ArtifactSize[]>("/project/temp/base.json", { fs });
	const current = await readJsonFile<ArtifactSize[]>("/project/temp/current.json", { fs });
	const diff = await readJsonFile<ArtifactDiff[]>("/project/temp/diff.json", { fs });

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

it("should detect added file between baseline and current", async () => {
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

	const base = await readJsonFile<ArtifactSize[]>("/project/temp/base.json", { fs });
	const current = await readJsonFile<ArtifactSize[]>("/project/temp/current.json", { fs });
	const diff = await readJsonFile<ArtifactDiff[]>("/project/temp/diff.json", { fs });

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

it("should detect removed file between baseline and current", async () => {
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

	const base = await readJsonFile<ArtifactSize[]>("/project/temp/base.json", { fs });
	const current = await readJsonFile<ArtifactSize[]>("/project/temp/current.json", { fs });
	const diff = await readJsonFile<ArtifactDiff[]>("/project/temp/diff.json", { fs });

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

it("should compare multiple artifacts", async () => {
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

	const base = await readJsonFile<ArtifactSize[]>("/project/temp/base.json", { fs });
	const current = await readJsonFile<ArtifactSize[]>("/project/temp/current.json", { fs });
	const diff = await readJsonFile<ArtifactDiff[]>("/project/temp/diff.json", { fs });

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

it("should respect exclude patterns in config", async () => {
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

	const base = await readJsonFile<ArtifactSize[]>("/project/temp/base.json", { fs });
	const current = await readJsonFile<ArtifactSize[]>("/project/temp/current.json", { fs });
	const diff = await readJsonFile<ArtifactDiff[]>("/project/temp/diff.json", { fs });

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

it("should handle empty artifacts gracefully", async () => {
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

	const base = await readJsonFile<ArtifactSize[]>("/project/temp/base.json", { fs });
	const current = await readJsonFile<ArtifactSize[]>("/project/temp/current.json", { fs });
	const diff = await readJsonFile<ArtifactDiff[]>("/project/temp/diff.json", { fs });

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

it("should output to console when no --output-file is provided", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify(makeConfig()),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	/* baseline */
	await fs.writeFile("/project/dist/app.js", "a".repeat(50));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* current */
	await fs.writeFile("/project/dist/app.js", "a".repeat(100));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	/* compare without output file */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=text",
	]);

	/* should have console output */
	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`
		"app: files=1 (+0), size=100B (+50B), gzip=24B (+0B), brotli=11B (+0B)
		"
	`);
});

it("should output to GitHub Actions when --output-github is provided", async () => {
	const { console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify(makeConfig()),
	});

	const parser = createParser({
		cwd: "/project",
		env: { GITHUB_OUTPUT: "/gha_out.txt" },
		console,
		fs,
	});

	/* baseline */
	await fs.writeFile("/project/dist/app.js", "a".repeat(50));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/base.json",
	]);

	/* current */
	await fs.writeFile("/project/dist/app.js", "a".repeat(100));
	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-file=temp/current.json",
	]);

	await fs.writeFile("/gha_out.txt", "", "utf8");

	/* compare with GitHub output */
	await parser.parseAsync([
		"compare",
		"--base=temp/base.json",
		"--current=temp/current.json",
		"--format=json",
		"--output-github=json:diff-result",
	]);

	const content = await fs.readFile("/gha_out.txt", "utf8");
	expect(content).toMatchInlineSnapshot(`
		"diff-result<<EOF
		[
		  {
		    "status": "updated",
		    "id": "app",
		    "name": "app",
		    "raw": {
		      "oldSize": 50,
		      "newSize": 100,
		      "difference": 50
		    },
		    "gzip": {
		      "oldSize": 24,
		      "newSize": 24,
		      "difference": 0
		    },
		    "brotli": {
		      "oldSize": 11,
		      "newSize": 11,
		      "difference": 0
		    },
		    "oldFiles": [
		      {
		        "filename": "dist/app.js",
		        "size": 50,
		        "gzip": 24,
		        "brotli": 11
		      }
		    ],
		    "newFiles": [
		      {
		        "filename": "dist/app.js",
		        "size": 100,
		        "gzip": 24,
		        "brotli": 11
		      }
		    ]
		  }
		]
		EOF
		"
	`);
});
