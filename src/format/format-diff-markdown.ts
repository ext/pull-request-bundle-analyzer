import { type ArtifactDiff } from "../artifact-diff.ts";
import { prettySize } from "../utils/index.ts";
import { filterUnchangedArtifacts } from "./filter-unchanged.ts";
import { type FormatDiffOptions } from "./format-diff.ts";
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
	const isChanged = it.raw.difference !== 0;
	const sizeCol = isChanged
		? `${num(it.raw.oldSize)} → **${num(it.raw.newSize)}** (${diff(it.raw.difference)})`
		: num(it.raw.newSize);
	const percent = formatPercent(it.raw);

	if (!showCompressed) {
		return `| ${name} | ${String(it.newFiles.length)} file(s) | ${sizeCol} | ${percent} |`;
	}

	const compressedCol = compressedColumn(it);

	return `| ${name} | ${String(it.newFiles.length)} file(s) | ${sizeCol} | ${compressedCol} | ${percent} |`;
}

function generateDescription(
	hasHeader: boolean,
	unchanged: "show" | "hide" | "collapse",
	results: ArtifactDiff[],
	filteredResults: ArtifactDiff[],
): string {
	if (!hasHeader) {
		return "";
	}

	const omittedCount = results.length - filteredResults.length;
	if (unchanged === "show" || omittedCount === 0) {
		return "Artifact sizes in this build.\n\n";
	}

	switch (unchanged) {
		case "hide":
			return "Artifact sizes in this build (artifacts with unchanged sizes omitted).\n\n";
		case "collapse": {
			return "Artifact sizes in this build (unchanged artifacts collapsed below).\n\n";
		}
	}
}

function generateDetailsSection(results: ArtifactDiff[], showDetails: boolean): string {
	if (!showDetails) {
		return "";
	}

	const omittedArtifacts = results.filter((artifact) => {
		return artifact.status === "updated" && artifact.raw.difference === 0;
	});

	if (omittedArtifacts.length === 0) {
		return "";
	}

	const showCompressedInDetails = omittedArtifacts.some(
		(it) => Boolean(it.gzip) || Boolean(it.brotli),
	);

	const detailsHeader = showCompressedInDetails
		? "| Artifact | Files | Size | Compressed |\n|---|---|---:|---:|\n"
		: "| Artifact | Files | Size |\n|---|---|---:|\n";

	const detailsRows = omittedArtifacts
		.map((it) => {
			const name = it.name.replace(/ /g, "&nbsp;");
			const sizeCol = num(it.raw.newSize);

			if (!showCompressedInDetails) {
				return `| ${name} | ${String(it.newFiles.length)} file(s) | ${sizeCol} |`;
			}

			const compressedCol = compressedColumn(it);
			return `| ${name} | ${String(it.newFiles.length)} file(s) | ${sizeCol} | ${compressedCol} |`;
		})
		.join("\n");

	const s = omittedArtifacts.length === 1 ? "" : "s";
	return `\n\n<details>\n<summary>${String(omittedArtifacts.length)} unchanged artifact${s}</summary>\n\n${detailsHeader}${detailsRows}\n\n</details>`;
}

function generateTrailer(
	results: ArtifactDiff[],
	filteredResults: ArtifactDiff[],
	shouldHide: boolean,
	unchanged: "show" | "hide" | "collapse",
): string {
	if (!shouldHide) {
		return "";
	}

	const omittedCount = results.length - filteredResults.length;
	if (omittedCount > 0) {
		const s = omittedCount === 1 ? "" : "s";
		const action = unchanged === "collapse" ? "collapsed" : "omitted";
		return `\n\n*${String(omittedCount)} artifact${s} ${action}*`;
	}
	return "";
}

export function markdownFormat(results: ArtifactDiff[], options: FormatDiffOptions): string {
	const header = options.header ? "## Artifact sizes\n\n" : "";
	const shouldHide = options.unchanged !== "show";
	const showDetails = options.unchanged === "collapse";
	const filteredResults = filterUnchangedArtifacts(results, options.unchanged);

	if (filteredResults.length === 0) {
		if (options.header) {
			return `${header}No artifact size changes in this build.\n`;
		}
		return "";
	}

	const description = generateDescription(
		options.header,
		options.unchanged,
		results,
		filteredResults,
	);

	const showCompressed = filteredResults.some((it) => Boolean(it.gzip) || Boolean(it.brotli));

	const tableHeader = showCompressed
		? "| Artifact | Files | Size | Compressed | Change |\n|---|---|---:|---:|---:|\n"
		: "| Artifact | Files | Size | Change |\n|---|---|---:|---:|\n";

	const rows = filteredResults
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

	const trailer = generateTrailer(results, filteredResults, shouldHide, options.unchanged);
	const details = generateDetailsSection(results, showDetails);

	return `${header}${description}${tableHeader}${rows}${trailer}${details}\n`;
}
