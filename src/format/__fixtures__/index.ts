/**
 * Test fixtures for format-diff tests.
 */

export { mixedChanges } from "./mixed-changes.ts";
export { singleAdded } from "./single-added.ts";
export { singleRemoved } from "./single-removed.ts";
export { gzipOnly } from "./gzip-only.ts";
export {
	noCompression,
	singleAddedNoCompression,
	singleRemovedNoCompression,
} from "./no-compression.ts";
export { mixedCompression } from "./mixed-compression.ts";
export { fileChanges } from "./file-changes.ts";
export {
	allChanged,
	multipleUnchanged,
	unchangedNoCompression,
	unchangedOnly,
} from "./unchanged-filtering.ts";
