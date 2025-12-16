import { expect, it, vi } from "vitest";
import { createParser } from "./cli.ts";
import { createConsole, createVolume } from "./test-helpers.ts";
import { UserError } from "./user-error.ts";

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

it("should show friendly error message when config file does not exist", async () => {
	const { console } = createConsole();
	const { fs } = await createVolume({});

	const spy = vi.fn();
	const parser = createParser({ cwd: "/project", env: {}, console, fs }).fail(spy);

	try {
		await parser.parseAsync(["analyze", "--config-file=missing-config.json"]);
	} catch {
		/* do nothing */
	}

	expect(spy).toHaveBeenCalledWith(null, expect.any(UserError), expect.anything());

	const [, error] = spy.mock.calls[0];

	expect(error).toEqual(
		expect.objectContaining({
			message:
				'Configuration file not found: "missing-config.json". Please check the `--config-file` path.',
			code: "ENOCONFIG",
			exitCode: 1,
		}),
	);
});
