import { Console } from "node:console";
import type nodefs from "node:fs/promises";
import { Volume } from "memfs";
import { WritableStreamBuffer } from "stream-buffers";
import { expect, it } from "vitest";
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

it("should write to GitHub Actions output when --output-github is provided", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify({
			artifacts: [{ id: "app", name: "app", include: "dist/**/*.js" }],
		}),
	});

	const parser = createParser({
		cwd: "/project",
		env: { GITHUB_OUTPUT: "/gha_out.txt" },
		console,
		fs,
	});

	await fs.writeFile("/project/dist/app.js", "a".repeat(50));
	await fs.writeFile("/gha_out.txt", "", "utf8");

	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-github=json:foo",
	]);

	const content = await fs.readFile("/gha_out.txt", "utf8");
	expect(content).toMatch(/^foo<<EOF\n[\s\S]*\nEOF\n$/);

	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`
		"[
		  {
		    "id": "app",
		    "artifact": "app",
		    "files": [
		      {
		        "filename": "dist/app.js",
		        "size": 50,
		        "gzip": 24,
		        "brotli": 11
		      }
		    ],
		    "size": 50,
		    "gzip": 24,
		    "brotli": 11
		  }
		]
		"
	`);
});

it("should write multiple GitHub outputs when multiple --output-github are provided", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify({
			artifacts: [{ id: "app", name: "app", include: "dist/**/*.js" }],
		}),
	});

	const parser = createParser({
		cwd: "/project",
		env: { GITHUB_OUTPUT: "/gha_out.txt" },
		console,
		fs,
	});

	await fs.writeFile("/project/dist/app.js", "c".repeat(40));
	await fs.writeFile("/gha_out.txt", "", "utf8");

	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-github=json:foo",
		"--output-github=markdown:bar",
	]);

	const content = await fs.readFile("/gha_out.txt", "utf8");
	expect(content).toMatch(/^foo<<EOF[\s\S]*?\nEOF\n/);
	expect(content).toMatch(/bar<<EOF[\s\S]*?\nEOF\n$/);

	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`
		"[
		  {
		    "id": "app",
		    "artifact": "app",
		    "files": [
		      {
		        "filename": "dist/app.js",
		        "size": 40,
		        "gzip": 24,
		        "brotli": 10
		      }
		    ],
		    "size": 40,
		    "gzip": 24,
		    "brotli": 10
		  }
		]
		"
	`);
});

it("should silently do nothing when --output-github is provided but GITHUB_OUTPUT is not set", async () => {
	const { stream, console } = createConsole();
	const { fs } = await createVolume({
		"/project/artifact-config.json": JSON.stringify({
			artifacts: [{ id: "app", name: "app", include: "dist/**/*.js" }],
		}),
	});

	const parser = createParser({ cwd: "/project", env: {}, console, fs });

	await fs.writeFile("/project/dist/app.js", "b".repeat(30));

	await parser.parseAsync([
		"analyze",
		"--config-file=artifact-config.json",
		"--format=json",
		"--output-github=json:foo",
	]);

	const stdout = stream.getContentsAsString("utf8");
	expect(stdout).toMatchInlineSnapshot(`
		"[
		  {
		    "id": "app",
		    "artifact": "app",
		    "files": [
		      {
		        "filename": "dist/app.js",
		        "size": 30,
		        "gzip": 23,
		        "brotli": 10
		      }
		    ],
		    "size": 30,
		    "gzip": 23,
		    "brotli": 10
		  }
		]
		"
	`);
});
