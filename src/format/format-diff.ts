import { type ArtifactDiff } from "../artifact-diff.ts";
import { jsonFormat } from "./format-diff-json.ts";
import { markdownFormat } from "./format-diff-markdown.ts";
import { textFormat } from "./format-diff-text.ts";
import { type Format } from "./formats.ts";

/**
 * Options for `formatDiff()`.
 *
 * @public
 */
export interface FormatDiffOptions {
	/** Whether output should be colorized */
	color: boolean;
}

/**
 * Formats the artifact diff results.
 *
 * @public
 * @param results - Results from `compareArtifacts()`.
 * @param format - `"json"`, `"markdown"` or `"text"`.
 * @param options - Options for formatting.
 * @returns A string in the specified format.
 */
export function formatDiff(
	results: ArtifactDiff[],
	format: Format,
	options: FormatDiffOptions,
): string {
	switch (format) {
		case "json":
			return jsonFormat(results);
		case "markdown":
			return markdownFormat(results);
		case "text":
			return textFormat(results, options);
	}
}
