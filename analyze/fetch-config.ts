import fs from "node:fs/promises";
import path from "node:path";
import { getHash } from "./lib/get-hash.ts";
import { getHeadRef } from "./lib/get-head-ref.ts";
import { getInput } from "./lib/get-input.ts";
import { getTargetRef } from "./lib/get-target-ref.ts";
import { runCommand } from "./lib/run-command.ts";
import { setOutput } from "./lib/set-output.ts";

function getConfigRef(configFrom: "head" | "target"): string {
	switch (configFrom) {
		case "head":
			return getHeadRef();
		case "target":
			return getTargetRef();
	}
}

async function fetchConfigFromGit(configRef: string, configFile: string): Promise<string> {
	await runCommand("git", ["fetch", "--depth=1", "origin", configRef]);

	/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked earlier */
	const runnerTemp = process.env["RUNNER_TEMP"]!;

	const configContent = await runCommand("git", ["show", `${configRef}:${configFile}`]);
	const hash = getHash(configContent);
	const fileName = `artifact-size-analyzer-${hash}.json`;
	const tempConfigFile = path.join(runnerTemp, fileName);

	await fs.writeFile(tempConfigFile, configContent);

	console.log(`Successfully fetched config from ${configRef}`);
	return tempConfigFile;
}

/* sanity check for required GitHub Actions environment variables */
const requiredEnvVars = [
	"GITHUB_OUTPUT",
	"GITHUB_HEAD_SHA",
	"GITHUB_BASE_SHA",
	"RUNNER_TEMP",
] as const;

for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		throw new Error(`Required environment variable ${envVar} is not set`);
	}
}

const configFrom = getInput("config-from");
const configFile = getInput("config-file");

switch (configFrom) {
	case "local": {
		console.log("Using local config file");
		await setOutput("config-file", configFile);
		break;
	}
	case "head":
	case "target": {
		console.log(`Fetching config file from ${configFrom} branch`);
		const configRef = getConfigRef(configFrom);
		console.log(`Using config ref: ${configRef}`);
		const resultConfigFile = await fetchConfigFromGit(configRef, configFile);
		await setOutput("config-file", resultConfigFile);
		break;
	}
	default: {
		throw new Error('config-from must be "head", "target", or "local"');
	}
}
