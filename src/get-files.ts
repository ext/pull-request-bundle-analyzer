import nodefs from "node:fs/promises";
import { type NormalizedArtifactConfig } from "./config/index.ts";
import { resolve } from "./utils/index.ts";

interface GetFilesOptions {
	artifact: Pick<NormalizedArtifactConfig, "include" | "exclude">;
	cwd: string;
	fs?: typeof nodefs | undefined;
}

/**
 * @internal
 */
export async function getFiles(options: GetFilesOptions): Promise<string[]> {
	const { artifact, cwd, fs = nodefs } = options;
	const { include, exclude } = artifact;

	const result = new Set<string>();

	for (const pattern of include) {
		/* eslint-disable-next-line @typescript-eslint/await-thenable -- memfs incorrectly types this */
		for await (const filePath of await fs.glob(pattern, { cwd })) {
			const st = await fs.stat(resolve(cwd, filePath));
			if (st.isFile()) {
				result.add(filePath);
			}
		}
	}

	if (exclude.length === 0) {
		return Array.from(result).toSorted((a, b) => a.localeCompare(b));
	}

	for (const pattern of exclude) {
		/* eslint-disable-next-line @typescript-eslint/await-thenable -- memfs incorrectly types this */
		for await (const filePath of await fs.glob(pattern, { cwd })) {
			result.delete(filePath);
		}
	}

	return Array.from(result).toSorted((a, b) => a.localeCompare(b));
}
