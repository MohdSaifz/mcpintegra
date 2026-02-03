import { z } from "zod";
import { StorageService } from "../services/storageService.js";
import { ResponseFormat } from "../types/index.js";
import { formatMappingAsJSON } from "../utils/formatters.js";
/**
 * Register mapping tools
 */
export function registerMappingTools(server) {
    // Suggest field mappings between schemas
    server.registerTool("mapping_suggest", {
        title: "Suggest Schema Mappings",
        description: `Analyze two schemas and suggest intelligent field mappings between them.

Uses semantic analysis to match fields between System A and System B based on:
- Field name similarity (exact match, case-insensitive, normalized)
- Synonym matching (email/e_mail, phone/telephone, etc.)
- Data type compatibility
- Structural similarity

Args:
  - system_a_endpoint (string): Path to System A endpoint (e.g., "/users", "/customers")
  - system_a_method (string): HTTP method for System A (e.g., "POST", "PUT")
  - system_b_endpoint (string): Path to System B endpoint
  - system_b_method (string): HTTP method for System B
  - confidence_threshold (number): Minimum confidence score 0.0-1.0 (default: 0.7)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  List of suggested field mappings with confidence scores and reasoning.
  Each suggestion includes:
  - Source field path
  - Target field path
  - Confidence score (0.0-1.0)
  - Reasoning for the match
  - Suggested transformation if needed

Examples:
  - Use when: "Map the customer creation endpoint from System A to System B"
  - Use when: "Suggest mappings for user profile data between systems"

Note: Schemas must be loaded first for both systems.`,
        inputSchema: z.object({
            system_a_endpoint: z.string().describe("System A endpoint path"),
            system_a_method: z.string().describe("System A HTTP method"),
            system_b_endpoint: z.string().describe("System B endpoint path"),
            system_b_method: z.string().describe("System B HTTP method"),
            confidence_threshold: z.number()
                .min(0.0)
                .max(1.0)
                .default(0.7)
                .describe("Minimum confidence score (0.0-1.0)"),
            response_format: z.nativeEnum(ResponseFormat)
                .default(ResponseFormat.MARKDOWN)
                .describe("Output format: 'markdown' or 'json'")
        }).strict(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false
        }
    }, async (params) => {
        // This is a placeholder - full implementation would:
        // 1. Retrieve loaded schemas from context
        // 2. Extract endpoint schemas
        // 3. Call MappingService.suggestMappings()
        // 4. Format and return results
        const message = `Mapping suggestions would be generated here for:\n` +
            `System A: ${params.system_a_method} ${params.system_a_endpoint}\n` +
            `System B: ${params.system_b_method} ${params.system_b_endpoint}\n` +
            `Confidence threshold: ${params.confidence_threshold}\n\n` +
            `This requires schemas to be loaded first. Use schema_load_system_a and schema_load_system_b.`;
        return {
            content: [{ type: "text", text: message }]
        };
    });
    // Save a mapping configuration
    server.registerTool("mapping_save", {
        title: "Save Schema Mapping",
        description: `Save a schema mapping configuration for reuse.

Persists a mapping between two endpoints so it can be loaded and reused for transformations. The mapping includes:
- Field mappings with transformations
- Validation rules
- Metadata

Args:
  - mapping_id (string): Unique identifier for this mapping
  - name (string): Human-readable name for the mapping
  - description (string, optional): Description of what this mapping does
  - system_a_endpoint (string): System A endpoint path
  - system_a_method (string): System A HTTP method
  - system_b_endpoint (string): System B endpoint path
  - system_b_method (string): System B HTTP method
  - field_mappings (string): JSON array of field mappings
  - metadata (string, optional): Additional metadata as JSON object

Returns:
  Confirmation that mapping was saved successfully.

Examples:
  - Use when: "Save this mapping as 'customer-sync'"
  - Use when: "Store the user profile mapping for later use"`,
        inputSchema: z.object({
            mapping_id: z.string().describe("Unique mapping identifier"),
            name: z.string().describe("Human-readable mapping name"),
            description: z.string().optional().describe("Mapping description"),
            system_a_endpoint: z.string().describe("System A endpoint"),
            system_a_method: z.string().describe("System A method"),
            system_b_endpoint: z.string().describe("System B endpoint"),
            system_b_method: z.string().describe("System B method"),
            field_mappings: z.string().describe("JSON array of field mappings"),
            metadata: z.string().optional().describe("Additional metadata as JSON")
        }).strict(),
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        }
    }, async (params) => {
        try {
            const fieldMappings = JSON.parse(params.field_mappings);
            const metadata = params.metadata ? JSON.parse(params.metadata) : undefined;
            const mapping = {
                id: params.mapping_id,
                name: params.name,
                description: params.description,
                sourceEndpoint: {
                    system: "A",
                    path: params.system_a_endpoint,
                    method: params.system_a_method
                },
                targetEndpoint: {
                    system: "B",
                    path: params.system_b_endpoint,
                    method: params.system_b_method
                },
                fieldMappings,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata
            };
            await StorageService.saveMapping(mapping);
            return {
                content: [{
                        type: "text",
                        text: `✓ Mapping '${params.name}' saved successfully with ID: ${params.mapping_id}`
                    }],
                structuredContent: { success: true, mapping_id: params.mapping_id }
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `Error saving mapping: ${errorMsg}`
                    }],
                isError: true
            };
        }
    });
    // Load a saved mapping
    server.registerTool("mapping_load", {
        title: "Load Schema Mapping",
        description: `Load a previously saved schema mapping configuration.

Retrieves a saved mapping by its ID for use in transformations.

Args:
  - mapping_id (string): Unique identifier of the mapping to load
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  The complete mapping configuration including all field mappings and rules.

Examples:
  - Use when: "Load the customer-sync mapping"
  - Use when: "Retrieve mapping with ID abc-123"`,
        inputSchema: z.object({
            mapping_id: z.string().describe("Mapping identifier to load"),
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
    }, async ({ mapping_id, response_format }) => {
        try {
            const mapping = await StorageService.getMapping(mapping_id);
            if (!mapping) {
                return {
                    content: [{
                            type: "text",
                            text: `Mapping with ID '${mapping_id}' not found`
                        }]
                };
            }
            let textContent;
            if (response_format === ResponseFormat.MARKDOWN) {
                textContent = formatMappingAsJSON(mapping); // Would use markdown formatter
            }
            else {
                textContent = JSON.stringify(mapping, null, 2);
            }
            return {
                content: [{ type: "text", text: textContent }],
                structuredContent: mapping
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `Error loading mapping: ${errorMsg}`
                    }],
                isError: true
            };
        }
    });
    // List all saved mappings
    server.registerTool("mapping_list", {
        title: "List Saved Mappings",
        description: `List all saved schema mapping configurations.

Returns a list of all mappings that have been saved, including their IDs, names, and descriptions.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  List of mappings with their metadata.

Examples:
  - Use when: "What mappings do I have saved?"
  - Use when: "Show all available schema mappings"`,
        inputSchema: z.object({
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
    }, async ({ response_format }) => {
        try {
            const mappings = await StorageService.listMappings();
            if (mappings.length === 0) {
                return {
                    content: [{
                            type: "text",
                            text: "No saved mappings found. Create one using mapping_save."
                        }]
                };
            }
            let textContent;
            if (response_format === ResponseFormat.MARKDOWN) {
                textContent = `# Saved Mappings (${mappings.length})\n\n`;
                for (const m of mappings) {
                    textContent += `## ${m.name}\n`;
                    textContent += `- **ID**: ${m.id}\n`;
                    if (m.description) {
                        textContent += `- **Description**: ${m.description}\n`;
                    }
                    textContent += `\n`;
                }
            }
            else {
                textContent = JSON.stringify({ count: mappings.length, mappings }, null, 2);
            }
            return {
                content: [{ type: "text", text: textContent }],
                structuredContent: { count: mappings.length, mappings }
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `Error listing mappings: ${errorMsg}`
                    }],
                isError: true
            };
        }
    });
    // Delete a mapping
    server.registerTool("mapping_delete", {
        title: "Delete Schema Mapping",
        description: `Delete a saved schema mapping configuration.

Permanently removes a mapping from storage.

Args:
  - mapping_id (string): ID of the mapping to delete

Returns:
  Confirmation of deletion.

Examples:
  - Use when: "Delete the old-customer-sync mapping"
  - Use when: "Remove mapping abc-123"`,
        inputSchema: z.object({
            mapping_id: z.string().describe("Mapping ID to delete")
        }).strict(),
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false
        }
    }, async ({ mapping_id }) => {
        try {
            const deleted = await StorageService.deleteMapping(mapping_id);
            if (deleted) {
                return {
                    content: [{
                            type: "text",
                            text: `✓ Mapping '${mapping_id}' deleted successfully`
                        }],
                    structuredContent: { success: true, deleted: true }
                };
            }
            else {
                return {
                    content: [{
                            type: "text",
                            text: `Mapping '${mapping_id}' not found`
                        }],
                    structuredContent: { success: false, deleted: false }
                };
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `Error deleting mapping: ${errorMsg}`
                    }],
                isError: true
            };
        }
    });
}
//# sourceMappingURL=mapping.js.map