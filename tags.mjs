import spawn from "nano-spawn";
import { parse } from "semver";

async function getTags(env, cwd) {
	const { stdout: tags } = await spawn("git", ["tag"], { env, cwd });
	return tags.split("\n");
}

export async function updateTags(context, version) {
	const { cwd, env, logger } = context;
	const parsed = parse(version);
	const current = `v${version}`;
	const major = `v${parsed.major}`;
	const minor = `v${parsed.major}.${parsed.minor}`;
	const tags = await getTags(env, cwd);
	const options = { env, cwd, stdout: "inherit", stderr: "inherit" };
	logger.log(`Updating git tags`);
	logger.log(`  ${current} -> ${major}`);
	logger.log(`  ${current} -> ${minor}`);
	if (tags.includes(major)) {
		await spawn("git", ["push", "origin", `:refs/tags/${major}`], options);
	}
	if (tags.includes(minor)) {
		await spawn("git", ["push", "origin", `:refs/tags/${minor}`], options);
	}
	await spawn("git", ["push", "origin", `${current}:${major}`], options);
	await spawn("git", ["push", "origin", `${current}:${minor}`], options);
}

export async function publish(_pluginConfig, context) {
	const { nextRelease } = context;
	await updateTags(context, nextRelease.version);
}
