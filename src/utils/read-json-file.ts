import type nodefs from "node:fs/promises";

interface ReadJsonFileOptions {
	fs: typeof nodefs;
}

/**
 * @internal
 * @param filePath - Path to JSON file
 * @param fs - Optional fs promises-like API to use (for testing)
 * @returns Parsed JSON content
 */
export async function readJsonFile<T>(filePath: string, options: ReadJsonFileOptions): Promise<T> {
	const { fs } = options;
	const content = await fs.readFile(filePath, "utf-8");
	return JSON.parse(content) as T;
}
