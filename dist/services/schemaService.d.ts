import type { APISchema, SchemaObject } from "../types/index.js";
/**
 * Service for loading and parsing API schemas
 */
export declare class SchemaService {
    /**
     * Load schema from OpenAPI/Swagger specification
     */
    static loadOpenAPISchema(url: string): Promise<APISchema>;
    /**
     * Parse OpenAPI specification into internal schema format
     */
    static parseOpenAPISpec(spec: any): APISchema;
    /**
     * Parse schema from JSON object
     */
    static parseJSONSchema(schema: any): APISchema;
    /**
     * Extract schema from endpoint definition
     */
    static extractSchemaFromEndpoint(endpoint: any): SchemaObject | undefined;
    /**
     * Normalize schema object to consistent format
     */
    static normalizeSchema(schema: any): SchemaObject;
    /**
     * Parse parameters from OpenAPI format
     */
    private static parseParameters;
    /**
     * Parse request body
     */
    private static parseRequestBody;
    /**
     * Parse authentication configuration
     */
    private static parseAuth;
    /**
     * Get all field paths from a schema (flattened)
     */
    static getFieldPaths(schema: SchemaObject, prefix?: string): string[];
    /**
     * Compare two schemas for similarity
     */
    static compareSchemas(schema1: SchemaObject, schema2: SchemaObject): number;
}
//# sourceMappingURL=schemaService.d.ts.map