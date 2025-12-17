import { describe, expect, it } from "vitest";
import { type ArtifactDiff } from "../artifact-diff.ts";
import { filterUnchangedArtifacts } from "./filter-unchanged.ts";

const unchangedArtifact: ArtifactDiff = {
	id: "unchanged",
	name: "unchanged",
	status: "updated",
	raw: { oldSize: 100, newSize: 100, difference: 0 },
	gzip: { oldSize: 80, newSize: 80, difference: 0 },
	brotli: { oldSize: 70, newSize: 70, difference: 0 },
	oldFiles: [],
	newFiles: [],
};

const changedArtifact: ArtifactDiff = {
	id: "changed",
	name: "changed",
	status: "updated",
	raw: { oldSize: 100, newSize: 110, difference: 10 },
	gzip: { oldSize: 80, newSize: 85, difference: 5 },
	brotli: { oldSize: 70, newSize: 72, difference: 2 },
	oldFiles: [],
	newFiles: [],
};

const addedArtifact: ArtifactDiff = {
	id: "added",
	name: "added",
	status: "added",
	raw: { oldSize: 0, newSize: 100, difference: 100 },
	gzip: { oldSize: 0, newSize: 80, difference: 80 },
	brotli: { oldSize: 0, newSize: 70, difference: 70 },
	oldFiles: [],
	newFiles: [],
};

const removedArtifact: ArtifactDiff = {
	id: "removed",
	name: "removed",
	status: "removed",
	raw: { oldSize: 100, newSize: 0, difference: -100 },
	gzip: { oldSize: 80, newSize: 0, difference: -80 },
	brotli: { oldSize: 70, newSize: 0, difference: -70 },
	oldFiles: [],
	newFiles: [],
};

const unchangedWithNullCompressionArtifact: ArtifactDiff = {
	id: "unchanged-null",
	name: "unchanged-null",
	status: "updated",
	raw: { oldSize: 100, newSize: 100, difference: 0 },
	gzip: null,
	brotli: null,
	oldFiles: [],
	newFiles: [],
};

describe("filterUnchangedArtifacts()", () => {
	it("should return all artifacts when unchanged is 'show'", () => {
		const artifacts = [unchangedArtifact, changedArtifact, addedArtifact, removedArtifact];
		const result = filterUnchangedArtifacts(artifacts, "show");
		expect(result).toEqual(artifacts);
		expect(result).toHaveLength(4);
	});

	it("should filter out unchanged artifacts when unchanged is 'hide'", () => {
		const artifacts = [unchangedArtifact, changedArtifact, addedArtifact, removedArtifact];
		const result = filterUnchangedArtifacts(artifacts, "hide");
		expect(result).toEqual([changedArtifact, addedArtifact, removedArtifact]);
		expect(result).toHaveLength(3);
	});

	it("should always keep added artifacts", () => {
		const artifacts = [addedArtifact];
		const result = filterUnchangedArtifacts(artifacts, "hide");
		expect(result).toEqual([addedArtifact]);
		expect(result).toHaveLength(1);
	});

	it("should always keep removed artifacts", () => {
		const artifacts = [removedArtifact];
		const result = filterUnchangedArtifacts(artifacts, "hide");
		expect(result).toEqual([removedArtifact]);
		expect(result).toHaveLength(1);
	});

	it("should handle artifacts with null compression correctly", () => {
		const artifacts = [unchangedWithNullCompressionArtifact, changedArtifact];
		const result = filterUnchangedArtifacts(artifacts, "hide");
		expect(result).toEqual([changedArtifact]);
		expect(result).toHaveLength(1);
	});

	it("should return empty array when all artifacts are unchanged and unchanged is 'hide'", () => {
		const artifacts = [unchangedArtifact, unchangedWithNullCompressionArtifact];
		const result = filterUnchangedArtifacts(artifacts, "hide");
		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});

	it("should handle empty array", () => {
		const artifacts: ArtifactDiff[] = [];
		const result = filterUnchangedArtifacts(artifacts, "hide");
		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});
});
