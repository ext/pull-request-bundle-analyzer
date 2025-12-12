/* eslint-disable n/no-unsupported-features/node-builtins -- styleText is backported to 22.13 */

import util from "node:util";
import type { BundleDiff } from "../bundle-diff.ts";
import { prettySize } from "../pretty-size.ts";
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

function num(value: number): string {
	return prettySize(value);
}

function sign(value: number): string {
	return value >= 0 ? "+" : "-";
}

function diff(value: number): string {
	return `${sign(value)}${prettySize(Math.abs(value))}`;
}

function jsonFormat(results: BundleDiff[]): string {
	return JSON.stringify(results, null, 2);
}

function markdownFormat(results: BundleDiff[]): string {
	const header = "## Bundle sizes\n\n";
	const tableHeader = "| Bundle | Files | Size | Compressed | Change |\n|---|---|---:|---:|---:|\n";

	const rows = results
		.map((it) => {
			const { newFiles } = it;
			const name = it.name.replace(/ /g, "&nbsp;");

			if (it.status === "added") {
				const sizeCol = `N/A → **${num(it.raw.newSize)}**`;
				const compressedCol = `gzip: ${num(it.gzip.newSize)}<br>brotli: ${num(it.brotli.newSize)}`;
				const percent = "+0.00%";
				return `| ${name} (added) | ${String(newFiles.length)} file(s) | ${sizeCol} | ${compressedCol} | ${percent} |`;
			}

			if (it.status === "removed") {
				const sizeCol = `${num(it.raw.oldSize)} → N/A`;
				return `| ${name} (removed) | N/A | ${sizeCol} | N/A | N/A |`;
			}

			const sizeCol = `${num(it.raw.oldSize)} → **${num(it.raw.newSize)}** (${diff(
				it.raw.difference,
			)})`;
			const compressedCol = `gzip: ${num(it.gzip.newSize)}<br>brotli: ${num(it.brotli.newSize)}`;

			let percent: string;
			if (it.raw.oldSize === 0) {
				percent = "+0.00%";
			} else if (it.raw.oldSize === it.raw.newSize) {
				percent = "-";
			} else {
				const pct = ((it.raw.difference / it.raw.oldSize) * 100).toFixed(2);
				percent = it.raw.difference >= 0 ? `+${pct}%` : `${pct}%`;
			}

			return `| ${name} | ${String(newFiles.length)} file(s) | ${sizeCol} | ${compressedCol} | ${percent} |`;
		})
		.join("\n");

	return `${header}${tableHeader}${rows}\n`;
}

function textFormat(results: BundleDiff[], options: FormatDiffOptions): string {
	const colorize = (text: string): string => (options.color ? util.styleText("cyan", text) : text);

	return results
		.map((it) => {
			if (it.status === "removed") {
				return `${it.name}: removed`;
			}

			const { oldFiles, newFiles } = it;
			const filesDiff = newFiles.length - oldFiles.length;
			const parts = [
				`files=${colorize(String(newFiles.length))} (${sign(filesDiff)}${String(
					Math.abs(filesDiff),
				)})`,
				`size=${colorize(num(it.raw.newSize))} (${diff(it.raw.difference)})`,
				`gzip=${colorize(num(it.gzip.newSize))} (${diff(it.gzip.difference)})`,
				`brotli=${colorize(num(it.brotli.newSize))} (${diff(it.brotli.difference)})`,
			];

			return `${it.name}: ${parts.join(", ")}`;
		})
		.join("\n");
}

export function formatDiff(
	results: BundleDiff[],
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
