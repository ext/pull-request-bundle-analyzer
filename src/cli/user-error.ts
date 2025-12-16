/**
 * Custom error class for errors that have human-readable messages and should
 * exit gracefully.
 *
 * @internal
 */
export class UserError extends Error {
	public readonly code: string;
	public readonly exitCode: number;

	public constructor(options: { message: string; code: "ENOCONFIG"; exitCode?: number }) {
		const { message, code, exitCode = 1 } = options;

		super(message);

		this.name = UserError.name;
		this.code = code;
		this.exitCode = exitCode;
	}
}
