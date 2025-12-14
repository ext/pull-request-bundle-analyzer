import fs from "node:fs/promises";
import { type ArtifactSize, compareArtifact, formatDiff } from "../dist/index.mjs";

/* previously saved output from `analyzeArtifact()` */
const base = JSON.parse(await fs.readFile("base.json", "utf8")) as ArtifactSize;
const current = JSON.parse(await fs.readFile("current.json", "utf8")) as ArtifactSize;

/* compares the two artifacts */
const result = compareArtifact(base, current);

/* format the result */
const out = formatDiff([result], "markdown", { color: false });
console.log(out);
