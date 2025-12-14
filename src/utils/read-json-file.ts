import nodefs from "node:fs/promises";

/**
 * @internal
 * @param filePath - Path to JSON file
 * @param fs - Optional fs promises-like API to use (for testing)
 * @returns Parsed JSON content
 */
export async function readJsonFile(filePath: string, fs: typeof nodefs = nodefs): Promise<unknown> {
	const content = await fs.readFile(filePath, "utf-8");
	return JSON.parse(content);
}
