import type nodefs from "node:fs/promises";
import { resolve } from "./resolve.ts";

/**
 * @internal
 */
export interface WriteFileOptions {
	cwd: string;
	filename: string;
	fs: typeof nodefs;
}

/**
 * @internal
 */
export async function writeFile(content: string, options: WriteFileOptions): Promise<void> {
	const { fs, cwd, filename } = options;
	const dst = resolve(cwd, filename);
	await fs.writeFile(dst, content, "utf8");
}
