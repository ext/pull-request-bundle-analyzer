/**
 * @internal
 */
export function toArray<T>(value: T | T[]): T[];
/**
 * @internal
 */
export function toArray<T, U>(value: T | T[], transform: (v: T) => U): U[];
/**
 * @internal
 */
export function toArray<T, U>(value: T | T[], transform?: (v: T) => U): T[] | U[] {
	const arr = Array.isArray(value) ? value : [value];
	if (transform) {
		return arr.map(transform);
	}
	return arr;
}
