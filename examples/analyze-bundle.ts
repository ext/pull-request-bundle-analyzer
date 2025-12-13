import { getBundleSize } from "../dist/index.mjs";

/* compression algorithm options */
const compression = {
	gzip: false,
	brotli: false,
};

/* bundle configuration (similar to the configuration file) */
const bundle = {
	id: "dist",
	name: "dist",
	include: ["dist/**/*.js"],
	exclude: [],
};

/* analyzes the configured bundle */
const result = await getBundleSize(bundle, { cwd: process.cwd(), compression });

console.log("Result:", result);
