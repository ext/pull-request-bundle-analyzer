import type nodefs from "node:fs/promises";
import { type BundleSize } from "./bundle-size.ts";
import { type NormalizedBundleConfig } from "./config/index.ts";
import { getFileSize } from "./get-file-size.ts";
import { getFiles } from "./get-files.ts";

/**
 * @public
 */
export interface GetBundleSizeOptions {
	/** Working directory */
	cwd: string;
	fs?: typeof nodefs | undefined;
}

/**
 * Get the total size of a bundle.
 *
 * @public
 * @param bundle - Bundle config
 * @param options - Options
 * @returns The total size of the bundle
 */
export async function getBundleSize(
	bundle: NormalizedBundleConfig,
	options: GetBundleSizeOptions,
): Promise<BundleSize> {
	const { cwd, fs } = options;
	const files = await getFiles({ bundle, cwd, fs });
	const result: BundleSize = {
		id: bundle.id,
		bundle: bundle.name,
		files: [],
		size: 0,
		gzip: 0,
		brotli: 0,
	};
	for (const filePath of files) {
		const size = await getFileSize(filePath, { cwd, fs });
		result.size += size.size;
		result.gzip += size.gzip;
		result.brotli += size.brotli;
		result.files.push({
			filename: filePath,
			size: size.size,
			gzip: size.gzip,
			brotli: size.brotli,
		});
	}
	return result;
}
