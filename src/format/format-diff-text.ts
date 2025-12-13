/* eslint-disable n/no-unsupported-features/node-builtins -- styleText is backported to 22.13 */

import util from "node:util";
import { type BundleDiff } from "../bundle-diff.ts";
import { type FormatDiffOptions } from "./format-diff.ts";
import { formatSize } from "./format-size.ts";

function sign(value: number): string {
	return value >= 0 ? "+" : "-";
}

function renderRemoved(it: BundleDiff): string {
	return `${it.name}: removed`;
}

function renderAddedOrUpdated(it: BundleDiff, colorize: (text: string) => string): string {
	const { oldFiles, newFiles } = it;
	const filesDiff = newFiles.length - oldFiles.length;
	const parts = [
		`files=${colorize(String(newFiles.length))} (${sign(filesDiff)}${String(Math.abs(filesDiff))})`,
		formatSize("size", it.raw, { style: "text", colorize }),
	];

	if (it.gzip !== null) {
		parts.push(formatSize("gzip", it.gzip, { style: "text", colorize }));
	}

	if (it.brotli !== null) {
		parts.push(formatSize("brotli", it.brotli, { style: "text", colorize }));
	}

	return `${it.name}: ${parts.join(", ")}`;
}

export function textFormat(results: BundleDiff[], options: FormatDiffOptions): string {
	const colorize = (text: string): string => {
		return options.color ? util.styleText("cyan", text) : text;
	};

	return results
		.map((it) => {
			switch (it.status) {
				case "removed":
					return renderRemoved(it);
				case "added":
				case "updated":
					return renderAddedOrUpdated(it, colorize);
				/* istanbul ignore next */
				/* v8 ignore next -- exhaustive switch, should never come here */
				default: {
					const _exhaustive: never = it.status;
					return _exhaustive;
				}
			}
		})
		.join("\n");
}
