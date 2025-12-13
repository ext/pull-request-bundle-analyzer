/**
 * The supported output formats for formatting.
 *
 * @public
 */
export const formats = ["json", "markdown", "text"] as const;

/**
 * The supported output formats for formatting.
 *
 * @public
 */
export type Format = (typeof formats)[number];
