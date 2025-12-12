import nodefs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { brotliCompress as brotliCb, gzip as gzipCb } from "node:zlib";

const gzip = promisify(gzipCb);
const brotliCompress = promisify(brotliCb);

export interface GetFileSizeResult {
	size: number;
	gzip: number | null;
	brotli: number | null;
}

/**
 * @internal
 */
export interface GetFileSizeOptions {
	cwd: string;
	fs?: typeof nodefs | undefined;
	/** Enabled compression algorithms */
	compression: { gzip: boolean; brotli: boolean };
}

/**
 * Get file sizes in bytes:
 *
 * - Raw size on disk,
 * - gzip compressed size,
 * - brotli compressed size.
 *
 * Note: this function assumes the file exists; it will throw if the path is missing.
 *
 * @internal
 * @param filePath - path to the file
 * @param options - optional options
 */
export async function getFileSize(
	filePath: string,
	options: GetFileSizeOptions,
): Promise<GetFileSizeResult> {
	const { cwd, fs = nodefs, compression } = options;

	const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
	const [buf, st] = await Promise.all([fs.readFile(fullPath), fs.stat(fullPath)]);
	let gzLen: number | null = null;
	let brLen: number | null = null;

	const doGzip = compression.gzip;
	const doBrotli = compression.brotli;

	const tasks: Array<Promise<unknown>> = [];

	if (doGzip) {
		tasks.push(
			gzip(buf).then((gzBuf) => {
				gzLen = Buffer.isBuffer(gzBuf) ? gzBuf.length : 0;
			}),
		);
	}

	if (doBrotli) {
		tasks.push(
			brotliCompress(buf).then((brBuf) => {
				brLen = Buffer.isBuffer(brBuf) ? brBuf.length : 0;
			}),
		);
	}

	if (tasks.length > 0) {
		await Promise.all(tasks);
	}

	return {
		size: st.size,
		gzip: gzLen,
		brotli: brLen,
	};
}
