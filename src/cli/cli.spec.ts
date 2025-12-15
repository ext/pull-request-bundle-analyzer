import { Console } from "node:console";
import type nodefs from "node:fs/promises";
import { Volume } from "memfs";
import { WritableStreamBuffer } from "stream-buffers";
import { expect, it } from "vitest";
import { createParser } from "./cli.ts";

expect.addSnapshotSerializer({
	test(value) {
		return typeof value === "string";
	},
	serialize(value) {
		return value;
	},
});

async function createVolume(): Promise<{ fs: typeof nodefs }> {
	const vol = Volume.fromJSON({});
	const fs = vol.promises as unknown as typeof nodefs;
	return { fs };
}

function createConsole(): { stream: WritableStreamBuffer; console: Console } {
	const stream = new WritableStreamBuffer();
	const bufConsole = new Console(stream, stream);
	return { stream, console: bufConsole };
}

it("should display help message", async () => {
	const { console } = createConsole();
	const { fs } = await createVolume();

	const parser = createParser({
		cwd: "/project",
		env: {},
		console,
		fs,
	});

	return new Promise<void>((resolve) => {
		expect.assertions(2);
		parser.parseAsync("--help", (err: unknown, _argv: unknown, output: unknown) => {
			expect(err).toBeUndefined();
			expect(output).toMatchSnapshot();
			resolve();
		});
	});
});

it("should display analyze command help", async () => {
	const { console } = createConsole();
	const { fs } = await createVolume();

	const parser = createParser({
		cwd: "/project",
		env: {},
		console,
		fs,
	});

	return new Promise<void>((resolve) => {
		expect.assertions(2);
		parser.parseAsync("analyze --help", (err: unknown, _argv: unknown, output: unknown) => {
			expect(err).toBeUndefined();
			expect(output).toMatchSnapshot();
			resolve();
		});
	});
});

it("should display compare command help", async () => {
	const { console } = createConsole();
	const { fs } = await createVolume();

	const parser = createParser({
		cwd: "/project",
		env: {},
		console,
		fs,
	});

	return new Promise<void>((resolve) => {
		expect.assertions(2);
		parser.parseAsync("compare --help", (err: unknown, _argv: unknown, output: unknown) => {
			expect(err).toBeUndefined();
			expect(output).toMatchSnapshot();
			resolve();
		});
	});
});
