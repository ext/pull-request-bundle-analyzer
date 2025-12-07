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
			const sizeCol = `${num(it.oldSize)} → **${num(it.newSize)}** (${diff(it.sizeDiff)})`;
			const compressedCol = `gzip: ${num(it.newGzip)}<br>brotli: ${num(it.newBrotli)}`;

			let percent: string;
			if (it.oldSize === 0) {
				percent = "+0.00%";
			} else if (it.oldSize === it.newSize) {
				percent = "-";
			} else {
				const pct = ((it.sizeDiff / it.oldSize) * 100).toFixed(2);
				percent = it.sizeDiff >= 0 ? `+${pct}%` : `${pct}%`;
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
			const { oldFiles, newFiles } = it;
			const filesDiff = newFiles.length - oldFiles.length;
			const parts = [
				`files=${colorize(String(newFiles.length))} (${sign(filesDiff)}${String(filesDiff)})`,
				`size=${colorize(num(it.newSize))} (${diff(it.sizeDiff)})`,
				`gzip=${colorize(num(it.newGzip))} (${diff(it.gzipDiff)})`,
				`brotli=${colorize(num(it.newBrotli))} (${diff(it.brotliDiff)})`,
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
