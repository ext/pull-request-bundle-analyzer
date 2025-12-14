import type nodefs from "node:fs/promises";
import { type ArtifactSize } from "./artifact-size.ts";
import { type NormalizedArtifactConfig } from "./config/index.ts";
import { getFileSize } from "./get-file-size.ts";
import { getFiles } from "./get-files.ts";

/**
 * @public
 */
export interface AnalyzeArtifactOptions {
	/** Working directory */
	cwd: string;
	fs?: typeof nodefs | undefined;
	/** Enabled compression algorithms */
	compression: { gzip: boolean; brotli: boolean };
}

/**
 * Analyze the total size of an artifact.
 *
 * @public
 * @param artifact - Artifact config
 * @param options - Options
 * @returns The total size of the artifact
 */
export async function analyzeArtifact(
	artifact: Pick<NormalizedArtifactConfig, "id" | "name" | "include" | "exclude">,
	options: AnalyzeArtifactOptions,
): Promise<ArtifactSize> {
	const { cwd, fs, compression } = options;
	const files = await getFiles({ artifact, cwd, fs });
	const result: ArtifactSize = {
		id: artifact.id,
		artifact: artifact.name,
		files: [],
		size: 0,
		gzip: 0,
		brotli: 0,
	};

	let gzipTotal = 0;
	let brotliTotal = 0;

	for (const filePath of files) {
		const size = await getFileSize(filePath, { cwd, fs, compression });
		result.size += size.size;
		if (size.gzip !== null) gzipTotal += size.gzip;
		if (size.brotli !== null) brotliTotal += size.brotli;
		result.files.push({
			filename: filePath,
			size: size.size,
			gzip: size.gzip,
			brotli: size.brotli,
		});
	}

	result.gzip = compression.gzip ? gzipTotal : null;
	result.brotli = compression.brotli ? brotliTotal : null;

	return result;
}
