import fs from "node:fs/promises";
import { type BundleSize, compareBundle } from "../dist/index.mjs";

/* previously saved output from `getBundleSize()` */
const base = JSON.parse(await fs.readFile("base.json", "utf8")) as BundleSize;
const current = JSON.parse(await fs.readFile("current.json", "utf8")) as BundleSize;

/* compares the two bundles */
const result = compareBundle(base, current);

console.log("Result:", result);
