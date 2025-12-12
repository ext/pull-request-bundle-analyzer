import { type BundleDiffSize } from "../bundle-diff.ts";
import { prettySize } from "../pretty-size.ts";

/**
 * @internal
 */
export interface FormatSizeOptions {
	/** 'markdown' for `gzip: 1 KB`, 'text' for `gzip=1 KB (+2 B)` */
	style: "markdown" | "text";
	/** Optional function to colorize the numeric portion only */
	colorize?: (text: string) => string;
}

/**
 * @internal
 */
export function formatSize(
	label: string,
	size: BundleDiffSize | null,
	options: FormatSizeOptions,
): string {
	const { style, colorize } = options;
	// If the compression algorithm is disabled, the value will be `null`.
	// Format a hyphen placeholder in that case (no diff shown).
	if (size === null) {
		switch (style) {
			case "text":
				return `${label}=-`;
			case "markdown":
				return `${label}: -`;
			default: {
				const _exhaustive: never = style;
				return _exhaustive;
			}
		}
	}

	const num = prettySize(size.newSize);
	const formattedNum = colorize ? colorize(num) : num;

	switch (style) {
		case "text": {
			const sign = size.difference >= 0 ? "+" : "-";
			const diff = `${sign}${prettySize(Math.abs(size.difference))}`;
			return `${label}=${formattedNum} (${diff})`;
		}
		case "markdown": {
			return `${label}: ${formattedNum}`;
		}
		default: {
			const _exhaustive: never = style;
			return _exhaustive;
		}
	}
}
