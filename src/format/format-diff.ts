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
	/**
	 * When `true` include the header for formats with headers.
	 */
	header: boolean;
	/** How to handle artifacts with no size changes */
	unchanged: "show" | "hide" | "collapse";
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
	options?: Partial<FormatDiffOptions>,
): string {
	const opts: FormatDiffOptions = {
		color: false,
		header: true,
		unchanged: "show",
		...options,
	};

	switch (format) {
		case "json":
			return jsonFormat(results);
		case "markdown":
			return markdownFormat(results, opts);
		case "text":
			return textFormat(results, opts);
		/* istanbul ignore next */
		/* v8 ignore next -- exhaustive switch, should never come here */
		default: {
			const _exhaustive: never = format;
			return _exhaustive;
		}
	}
}
