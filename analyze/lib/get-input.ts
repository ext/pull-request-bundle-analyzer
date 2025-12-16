/**
 * Get input from GitHub Actions
 */
export function getInput(name: string): string {
	return process.env[`INPUT_${name.toUpperCase().replace(/-/g, "_")}`] ?? "";
}
