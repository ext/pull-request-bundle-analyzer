/**
 * Get target ref from environment
 */
export function getTargetRef(): string {
	/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked earlier */
	return process.env["GITHUB_BASE_SHA"]!;
}
