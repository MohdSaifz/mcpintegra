import type { APISchema, SchemaMapping } from "../types/index.js";
/**
 * Format schema as Markdown
 */
export declare function formatSchemaAsMarkdown(schema: APISchema, systemName: string): string;
/**
 * Format schema as JSON
 */
export declare function formatSchemaAsJSON(schema: APISchema): string;
/**
 * Format mapping as markdown
 */
export declare function formatMappingsAsMarkdown(suggestions: any[]): string;
/**
 * Format mapping as JSON
 */
export declare function formatMappingAsJSON(mapping: SchemaMapping): string;
/**
 * Truncate text if it exceeds character limit
 */
export declare function truncateText(text: string, limit: number): string;
//# sourceMappingURL=formatters.d.ts.map