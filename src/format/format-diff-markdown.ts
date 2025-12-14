import { type ArtifactDiff } from "../artifact-diff.ts";
import { prettySize } from "../pretty-size.ts";
import { formatPercent } from "./format-percent.ts";
import { formatSize } from "./format-size.ts";

function num(value: number): string {
	return prettySize(value);
}

function sign(value: number): string {
	return value >= 0 ? "+" : "-";
}

function diff(value: number): string {
	return `${sign(value)}${prettySize(Math.abs(value))}`;
}

function compressedColumn(it: ArtifactDiff): string {
	const parts: string[] = [];

	if (it.gzip !== null) {
		parts.push(formatSize("gzip", it.gzip, { style: "markdown" }));
	}

	if (it.brotli !== null) {
		parts.push(formatSize("brotli", it.brotli, { style: "markdown" }));
	}

	if (parts.length === 0) {
		return "N/A";
	}

	return parts.join("<br>");
}

function renderAddedRow(it: ArtifactDiff, showCompressed: boolean): string {
	const name = it.name.replace(/ /g, "&nbsp;");
	const sizeCol = `N/A → **${num(it.raw.newSize)}**`;

	if (!showCompressed) {
		const percent = "+0.00%";
		return `| ${name} (added) | ${String(it.newFiles.length)} file(s) | ${sizeCol} | ${percent} |`;
	}

	const compressedCol = compressedColumn(it);
	const percent = "+0.00%";

	return `| ${name} (added) | ${String(it.newFiles.length)} file(s) | ${sizeCol} | ${compressedCol} | ${percent} |`;
}

function renderRemovedRow(it: ArtifactDiff, showCompressed: boolean): string {
	const name = it.name.replace(/ /g, "&nbsp;");
	const sizeCol = `${num(it.raw.oldSize)} → N/A`;

	if (!showCompressed) {
		return `| ${name} (removed) | N/A | ${sizeCol} | N/A |`;
	}

	return `| ${name} (removed) | N/A | ${sizeCol} | N/A | N/A |`;
}

function renderUpdatedRow(it: ArtifactDiff, showCompressed: boolean): string {
	const name = it.name.replace(/ /g, "&nbsp;");
	const sizeCol = `${num(it.raw.oldSize)} → **${num(it.raw.newSize)}** (${diff(
		it.raw.difference,
	)})`;
	const percent = formatPercent(it.raw);

	if (!showCompressed) {
		return `| ${name} | ${String(it.newFiles.length)} file(s) | ${sizeCol} | ${percent} |`;
	}

	const compressedCol = compressedColumn(it);

	return `| ${name} | ${String(it.newFiles.length)} file(s) | ${sizeCol} | ${compressedCol} | ${percent} |`;
}

export function markdownFormat(results: ArtifactDiff[], options: { header: boolean }): string {
	const header = options.header ? "## Artifact sizes\n\n" : "";
	const showCompressed = results.some((it) => Boolean(it.gzip) || Boolean(it.brotli));

	const tableHeader = showCompressed
		? "| Artifact | Files | Size | Compressed | Change |\n|---|---|---:|---:|---:|\n"
		: "| Artifact | Files | Size | Change |\n|---|---|---:|---:|\n";

	const rows = results
		.map((it) => {
			switch (it.status) {
				case "added":
					return renderAddedRow(it, showCompressed);
				case "removed":
					return renderRemovedRow(it, showCompressed);
				case "updated":
					return renderUpdatedRow(it, showCompressed);
				/* istanbul ignore next */
				/* v8 ignore next -- exhaustive switch, should never come here */
				default: {
					const _exhaustive: never = it.status;
					return _exhaustive;
				}
			}
		})
		.join("\n");

	return `${header}${tableHeader}${rows}\n`;
}
