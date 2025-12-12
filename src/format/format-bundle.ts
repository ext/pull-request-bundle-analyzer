/* eslint-disable n/no-unsupported-features/node-builtins -- styleText is backported to 22.13 */

import util from "node:util";
import { type BundleSize } from "../bundle-size.ts";
import { prettySize } from "../pretty-size.ts";
import { type Format } from "./formats.ts";

/**
 * Options for `formatBundle()`.
 *
 * @public
 */
export interface FormatBundleOptions {
	/** Whether output should be colorized */
	color: boolean;
}

function formatJson(bundles: BundleSize[]): string {
	return JSON.stringify(bundles, null, 2);
}

function formatMaybe(size: number | null): string {
	return size === null ? "-" : prettySize(size);
}

function formatMarkdown(bundles: BundleSize[]): string {
	const header = "## Bundle sizes\n\n";
	const tableHeader = "| Bundle | Files | Size | Gzip | Brotli |\n|---|---|---:|---:|---:|\n";
	const rows = bundles
		.map((item) => {
			const cells = [
				`\`${item.bundle}\``,
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

function formatText(bundles: BundleSize[], options: FormatBundleOptions): string {
	const { color } = options;

	const colorize = (text: string): string => {
		return color ? util.styleText("cyan", text) : text;
	};

	return bundles
		.map((item) => {
			const parts = [
				`files=${colorize(String(item.files.length))}`,
				`size=${colorize(prettySize(item.size))}`,
				`gzip=${colorize(formatMaybe(item.gzip))}`,
				`brotli=${colorize(formatMaybe(item.brotli))}`,
			];

			const header = `${item.bundle}: ${parts.join(", ")}`;

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
 * Format the result of the bundle analysis.
 *
 * @public
 * @param bundles - Bundles to get results from
 * @param format - Output format
 * @returns Formatted string
 */
export function formatBundle(
	bundles: BundleSize[],
	format: Format,
	options: FormatBundleOptions,
): string {
	switch (format) {
		case "json":
			return formatJson(bundles);
		case "markdown":
			return formatMarkdown(bundles);
		case "text":
			return formatText(bundles, options);
	}
}
