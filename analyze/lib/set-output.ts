import { appendFile } from "node:fs/promises";

/**
 * Write output for GitHub Actions
 */
export async function setOutput(name: string, value: string): Promise<void> {
	/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked earlier */
	const githubOutput = process.env["GITHUB_OUTPUT"]!;
	await appendFile(githubOutput, `${name}=${value}\n`);
	console.log(`${name}=${value}`);
}
