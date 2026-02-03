import { z } from "zod";
import { SchemaService } from "../services/schemaService.js";
import { ResponseFormat } from "../types/index.js";
import { formatSchemaAsMarkdown } from "../utils/formatters.js";
/**
 * Register schema discovery tools
 */
export function registerSchemaDiscoveryTools(server) {
    // Load System A schema from OpenAPI/Swagger URL
    server.registerTool("schema_load_system_a", {
        title: "Load System A Schema",
        description: `Load and parse the API schema for System A from an OpenAPI/Swagger specification URL.

System A is expected to have a well-defined REST API with a complete OpenAPI specification. This tool fetches the specification and parses it into an internal format for mapping.

Args:
  - url (string): URL to the OpenAPI/Swagger specification (must be JSON or YAML format)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Schema information including endpoints, parameters, request/response schemas, and authentication details.

Examples:
  - Use when: "Load the schema from https://api.example.com/openapi.json"
  - Use when: "Parse System A schema at https://docs.example.com/api/v1/swagger.yaml"

Error Handling:
  - Returns clear error if URL is unreachable
  - Returns error if specification format is invalid`,
        inputSchema: z.object({
            url: z.string().url().describe("URL to OpenAPI/Swagger specification"),
            response_format: z.nativeEnum(ResponseFormat)
                .default(ResponseFormat.MARKDOWN)
                .describe("Output format: 'markdown' or 'json'")
        }).strict(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        }
    }, async ({ url, response_format }) => {
        try {
            const schema = await SchemaService.loadOpenAPISchema(url);
            const output = {
                success: true,
                schema,
                endpoints_count: schema.endpoints.length,
                base_url: schema.baseUrl,
                version: schema.version
            };
            let textContent;
            if (response_format === ResponseFormat.MARKDOWN) {
                textContent = formatSchemaAsMarkdown(schema, "System A");
            }
            else {
                textContent = JSON.stringify(output, null, 2);
            }
            return {
                content: [{ type: "text", text: textContent }],
                structuredContent: output
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `Error loading System A schema: ${errorMsg}`
                    }],
                isError: true
            };
        }
    });
    // Load System B schema from JSON or URL
    server.registerTool("schema_load_system_b", {
        title: "Load System B Schema",
        description: `Load and parse the API schema for System B from a JSON specification or URL.

System B may have varying schema formats. This tool accepts either:
- A URL to an OpenAPI/Swagger specification
- A JSON string containing schema definition
- A URL to a custom JSON schema

Args:
  - source (string): Either a URL or JSON string containing the schema
  - source_type ('url' | 'json'): Type of source being provided (default: 'url')
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Schema information including endpoints, parameters, and data structures.

Examples:
  - Use when: "Load System B schema from https://api.systemb.com/schema.json"
  - Use when: "Parse this JSON schema for System B: {...}"

Error Handling:
  - Returns error if source is invalid or unreachable
  - Attempts to auto-detect schema format if not standard`,
        inputSchema: z.object({
            source: z.string().describe("URL or JSON string containing schema"),
            source_type: z.enum(["url", "json"])
                .default("url")
                .describe("Type of source: 'url' for URL, 'json' for JSON string"),
            response_format: z.nativeEnum(ResponseFormat)
                .default(ResponseFormat.MARKDOWN)
                .describe("Output format: 'markdown' or 'json'")
        }).strict(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        }
    }, async ({ source, source_type, response_format }) => {
        try {
            let schema;
            if (source_type === "url") {
                schema = await SchemaService.loadOpenAPISchema(source);
            }
            else {
                const jsonSchema = JSON.parse(source);
                schema = SchemaService.parseJSONSchema(jsonSchema);
            }
            const output = {
                success: true,
                schema,
                endpoints_count: schema.endpoints.length,
                base_url: schema.baseUrl,
                version: schema.version
            };
            let textContent;
            if (response_format === ResponseFormat.MARKDOWN) {
                textContent = formatSchemaAsMarkdown(schema, "System B");
            }
            else {
                textContent = JSON.stringify(output, null, 2);
            }
            return {
                content: [{ type: "text", text: textContent }],
                structuredContent: output
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `Error loading System B schema: ${errorMsg}`
                    }],
                isError: true
            };
        }
    });
    // List endpoints for a system
    server.registerTool("schema_list_endpoints", {
        title: "List Endpoints",
        description: `List all available API endpoints for a system.

Retrieves a list of all REST API endpoints available in the specified system, including HTTP methods, paths, and descriptions.

Args:
  - system ('A' | 'B'): Which system to list endpoints for
  - method (string, optional): Filter by HTTP method (GET, POST, PUT, DELETE, etc.)
  - path_filter (string, optional): Filter endpoints by path substring
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  List of endpoints with their methods, paths, and descriptions.

Examples:
  - Use when: "What endpoints are available in System A?"
  - Use when: "Show me all POST endpoints in System B"
  - Use when: "Find endpoints with 'user' in the path"

Note: Schema must be loaded first using schema_load_system_a or schema_load_system_b`,
        inputSchema: z.object({
            system: z.enum(["A", "B"]).describe("System to list endpoints for"),
            method: z.string().optional().describe("Filter by HTTP method"),
            path_filter: z.string().optional().describe("Filter by path substring"),
            response_format: z.nativeEnum(ResponseFormat)
                .default(ResponseFormat.MARKDOWN)
                .describe("Output format: 'markdown' or 'json'")
        }).strict(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true
        }
    }, async ({ system, method, path_filter }) => {
        // This would retrieve from loaded schema in production
        // For now, return a placeholder response
        const message = `Endpoint listing for System ${system} not yet implemented. ` +
            `This tool would filter endpoints by method=${method || "any"} and path=${path_filter || "any"}. ` +
            `Please load the schema first using schema_load_system_${system.toLowerCase()}.`;
        return {
            content: [{ type: "text", text: message }]
        };
    });
}
// Note: formatters.js would be created separately with helper functions
//# sourceMappingURL=schemaDiscovery.js.map