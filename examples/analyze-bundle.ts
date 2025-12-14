import { analyzeArtifact } from "../dist/index.mjs";

/* compression algorithm options */
const compression = {
	gzip: false,
	brotli: false,
};

/* artifact configuration (similar to the configuration file) */
const artifact = {
	id: "dist",
	name: "dist",
	include: ["dist/**/*.js"],
	exclude: [],
};

/* analyzes the configured artifact */
const result = await analyzeArtifact(artifact, { cwd: process.cwd(), compression });

console.log("Result:", result);
