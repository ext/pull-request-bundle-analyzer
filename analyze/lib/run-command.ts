import { spawn } from "node:child_process";
import { once } from "node:events";

/**
 * Run a command with arguments using spawn.
 *
 * @returns stdout
 */
export async function runCommand(command: string, args: readonly string[]): Promise<string> {
	const child = spawn(command, args, {
		stdio: ["ignore", "pipe", "pipe"],
		shell: false,
	});

	const timeoutId = setTimeout(() => {
		child.kill("SIGTERM");
	}, 60000 /* 1 minute */);

	let stdout = "";
	let stderr = "";

	child.stdout.setEncoding("utf8");
	child.stderr.setEncoding("utf8");

	child.stdout.on("data", (chunk: string) => {
		stdout += chunk;
	});

	child.stderr.on("data", (chunk: string) => {
		stderr += chunk;
	});

	const [exitCode, signal] = (await once(child, "close")) as [
		code: number | null,
		signal: NodeJS.Signals | null,
	];

	clearTimeout(timeoutId);

	if (exitCode !== 0) {
		const codeStr = exitCode?.toString() ?? (signal ? `signal ${signal}` : "unknown");
		throw new Error(
			`Command '${command} ${args.join(" ")}' failed with exit code ${codeStr}: ${stderr.trim()}`,
		);
	}

	return stdout;
}
