import fs from "node:fs/promises";
import { type ArtifactSize, compareArtifact } from "../dist/index.mjs";

/* previously saved output from `analyzeArtifact()` */
const base = JSON.parse(await fs.readFile("base.json", "utf8")) as ArtifactSize;
const current = JSON.parse(await fs.readFile("current.json", "utf8")) as ArtifactSize;

/* compares the two artifacts */
const result = compareArtifact(base, current);

console.log("Result:", result);
