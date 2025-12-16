/**
 * Get head ref from environment
 */
export function getHeadRef(): string {
	/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked earlier */
	return process.env["GITHUB_HEAD_SHA"]!;
}
