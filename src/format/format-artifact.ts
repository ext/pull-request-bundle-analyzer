/* eslint-disable n/no-unsupported-features/node-builtins -- styleText is backported to 22.13 */

import util from "node:util";
import { type ArtifactSize } from "../artifact-size.ts";
import { prettySize } from "../pretty-size.ts";
import { type Format } from "./formats.ts";

/**
 * Options for `formatArtifact()`.
 *
 * @public
 */
export interface FormatArtifactOptions {
	/** Whether output should be colorized */
	color: boolean;
	/**
	 * When `true` include the header for formats with headers.
	 */
	header: boolean;
}

function formatJson(artifacts: ArtifactSize[]): string {
	return JSON.stringify(artifacts, null, 2);
}

function formatMaybe(size: number | null): string {
	return size === null ? "-" : prettySize(size);
}

function formatMarkdown(artifacts: ArtifactSize[], options: { header: boolean }): string {
	const header = options.header ? "## Artifact sizes\n\n" : "";
	const tableHeader = "| Artifact | Files | Size | Gzip | Brotli |\n|---|---|---:|---:|---:|\n";
	const rows = artifacts
		.map((item) => {
			const cells = [
				`\`${item.artifact}\``,
				`${String(item.files.length)} file(s)`,
				prettySize(item.size),
				formatMaybe(item.gzip),
				formatMaybe(item.brotli),
			];
			return ["| ", cells.join(" | "), " |"].join("");
		})
		.join("\n");

	return `${header}${tableHeader}${rows}\n`;
}

function formatText(artifacts: ArtifactSize[], options: FormatArtifactOptions): string {
	const { color } = options;

	const colorize = (text: string): string => {
		return color ? util.styleText("cyan", text) : text;
	};

	return artifacts
		.map((item) => {
			const parts = [
				`files=${colorize(String(item.files.length))}`,
				`size=${colorize(prettySize(item.size))}`,
				`gzip=${colorize(formatMaybe(item.gzip))}`,
				`brotli=${colorize(formatMaybe(item.brotli))}`,
			];

			const header = `${item.artifact}: ${parts.join(", ")}`;

			if (item.files.length === 0) {
				return header;
			}
			const fileDetails = item.files;
			const fileLines = fileDetails.map((f, i) => {
				const isLast = i === fileDetails.length - 1;
				const symbol = isLast ? "└" : "├";
				const cells = [
					` ${symbol} ${f.filename} size=${colorize(prettySize(f.size))}`,
					`gzip=${colorize(formatMaybe(f.gzip))}`,
					`brotli=${colorize(formatMaybe(f.brotli))}`,
				];
				return cells.join(", ");
			});

			return [header, ...fileLines].join("\n");
		})
		.join("\n");
}

/**
 * Format the result of the artifact analysis.
 *
 * @public
 * @param artifacts - Artifacts to get results from
 * @param format - Output format
 * @returns Formatted string
 */
export function formatArtifact(
	artifacts: ArtifactSize[],
	format: Format,
	options?: Partial<FormatArtifactOptions>,
): string {
	const opts: FormatArtifactOptions = {
		color: false,
		header: true,
		...options,
	};

	switch (format) {
		case "json":
			return formatJson(artifacts);
		case "markdown":
			return formatMarkdown(artifacts, opts);
		case "text":
			return formatText(artifacts, opts);
	}
}
