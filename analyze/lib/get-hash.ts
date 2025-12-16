import crypto from "node:crypto";

/**
 * Generate a hash of the given content.
 *
 * @param content - The content to hash
 * @param length - The length of the hash to return (default: 8)
 * @returns The first `length` characters of the SHA-256 hash
 */
export function getHash(content: string, length = 8): string {
	return crypto.createHash("sha256").update(content).digest("hex").slice(0, length);
}
