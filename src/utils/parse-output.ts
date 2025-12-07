import { type Format, formats } from "../format/index.ts";

export interface ParsedOutput {
	format: Format;
	key: string;
}

export interface ParsedOutputMaybeFormat {
	format: Format | undefined;
	key: string;
}

export function parseOutput(
	value: unknown,
	options: { paramName: string; requireFormat: true },
): ParsedOutput;
export function parseOutput(
	value: unknown,
	options: { paramName: string; requireFormat: false },
): ParsedOutputMaybeFormat;
export function parseOutput(
	value: unknown,
	options: { paramName: string; requireFormat: boolean },
): ParsedOutput | ParsedOutputMaybeFormat {
	const { paramName, requireFormat } = options;

	if (typeof value !== "string") {
		throw new Error(`${paramName} must be a string in the form 'format:key'`);
	}

	const parts = value.split(":", 2);
	if (parts.length !== 2) {
		if (requireFormat) {
			throw new Error(`${paramName} must be in the form 'format:key'`);
		}
		return { format: undefined, key: value };
	}

	const [fmt, key] = parts;
	if (!(formats as readonly string[]).includes(fmt)) {
		throw new Error(
			`Invalid format for ${paramName}: ${fmt}. Supported formats: ${formats.join(",")}`,
		);
	}

	if (!key) {
		throw new Error(`${paramName} key must not be empty`);
	}

	return { format: fmt as Format, key };
}
