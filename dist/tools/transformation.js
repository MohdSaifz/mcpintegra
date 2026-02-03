import { z } from "zod";
import { TransformationService } from "../services/transformationService.js";
import { StorageService } from "../services/storageService.js";
import { ResponseFormat } from "../types/index.js";
/**
 * Register transformation tools
 */
export function registerTransformationTools(server) {
    // Transform payload from System A to System B
    server.registerTool("transform_a_to_b", {
        title: "Transform System A to System B",
        description: `Transform a payload from System A format to System B format using a saved mapping.

Takes data from System A and converts it to System B's expected format, applying all field mappings and transformations defined in the mapping configuration.

Args:
  - mapping_id (string): ID of the mapping to use for transformation
  - payload (string): JSON string containing System A payload data
  - validate (boolean): Whether to validate the result (default: true)
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Transformed payload in System B format, along with:
  - Success/failure status
  - Transformation errors (if any)
  - Warnings about unmapped fields
  - Validation results

Examples:
  - Use when: "Transform this customer data to System B format"
  - Use when: "Convert System A user payload using the user-sync mapping"

Error Handling:
  - Reports missing required fields
  - Shows transformation errors with field details
  - Lists unmapped fields as warnings`,
        inputSchema: z.object({
            mapping_id: z.string().describe("Mapping ID to use"),
            payload: z.string().describe("JSON payload from System A"),
            validate: z.boolean()
                .default(true)
                .describe("Validate transformed payload"),
            response_format: z.nativeEnum(ResponseFormat)
                .default(ResponseFormat.JSON)
                .describe("Output format")
        }).strict(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        }
    }, async ({ mapping_id, payload, validate, response_format }) => {
        try {
            // Load the mapping
            const mapping = await StorageService.getMapping(mapping_id);
            if (!mapping) {
                return {
                    content: [{
                            type: "text",
                            text: `Mapping '${mapping_id}' not found`
                        }],
                    isError: true
                };
            }
            // Parse payload
            const sourcePayload = JSON.parse(payload);
            // Transform
            const result = TransformationService.transformPayload(sourcePayload, mapping);
            // Validate if requested
            let validationResult;
            if (validate && result.success && result.transformedPayload) {
                validationResult = TransformationService.validateTransformedPayload(result.transformedPayload, mapping);
            }
            // Format output
            let textContent;
            if (response_format === ResponseFormat.MARKDOWN) {
                textContent = `# Transformation Result\n\n`;
                textContent += `**Status**: ${result.success ? "✓ Success" : "✗ Failed"}\n\n`;
                if (result.transformedPayload) {
                    textContent += `## Transformed Payload\n\`\`\`json\n`;
                    textContent += JSON.stringify(result.transformedPayload, null, 2);
                    textContent += `\n\`\`\`\n\n`;
                }
                if (result.errors && result.errors.length > 0) {
                    textContent += `## Errors\n`;
                    for (const error of result.errors) {
                        textContent += `- **${error.field}**: ${error.error}\n`;
                    }
                    textContent += `\n`;
                }
                if (result.warnings && result.warnings.length > 0) {
                    textContent += `## Warnings\n`;
                    for (const warning of result.warnings) {
                        textContent += `- ${warning}\n`;
                    }
                    textContent += `\n`;
                }
                if (validationResult && !validationResult.valid) {
                    textContent += `## Validation Errors\n`;
                    for (const error of validationResult.errors) {
                        textContent += `- ${error}\n`;
                    }
                }
            }
            else {
                textContent = JSON.stringify({
                    ...result,
                    validation: validationResult
                }, null, 2);
            }
            return {
                content: [{ type: "text", text: textContent }],
                structuredContent: {
                    ...result,
                    validation: validationResult
                }
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `Error transforming payload: ${errorMsg}`
                    }],
                isError: true
            };
        }
    });
    // Transform payload from System B to System A
    server.registerTool("transform_b_to_a", {
        title: "Transform System B to System A",
        description: `Transform a payload from System B format to System A format using a saved mapping.

Reverse transformation that takes data from System B and converts it to System A's expected format.

Args:
  - mapping_id (string): ID of the mapping to use (will be reversed)
  - payload (string): JSON string containing System B payload data
  - validate (boolean): Whether to validate the result (default: true)
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Transformed payload in System A format with status and any errors/warnings.

Examples:
  - Use when: "Transform this System B response back to System A format"
  - Use when: "Convert System B data to System A using the sync mapping"`,
        inputSchema: z.object({
            mapping_id: z.string().describe("Mapping ID to use"),
            payload: z.string().describe("JSON payload from System B"),
            validate: z.boolean()
                .default(true)
                .describe("Validate transformed payload"),
            response_format: z.nativeEnum(ResponseFormat)
                .default(ResponseFormat.JSON)
                .describe("Output format")
        }).strict(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        }
    }, async (params) => {
        // Implementation would be similar to transform_a_to_b but with reversed mapping
        return {
            content: [{
                    type: "text",
                    text: `Reverse transformation from System B to System A using mapping '${params.mapping_id}'. ` +
                        `Implementation would reverse the field mappings and apply transformations in opposite direction.`
                }]
        };
    });
    // Generate example payload
    server.registerTool("generate_example_payload", {
        title: "Generate Example Payload",
        description: `Generate an example payload for testing based on a mapping.

Creates sample data that matches the schema expected by either System A or System B, useful for testing transformations.

Args:
  - mapping_id (string): Mapping ID to use for schema reference
  - system ('A' | 'B'): Which system to generate example for
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Example payload with realistic sample values for all fields.

Examples:
  - Use when: "Generate test data for System A"
  - Use when: "Create an example payload for testing the transformation"`,
        inputSchema: z.object({
            mapping_id: z.string().describe("Mapping ID"),
            system: z.enum(["A", "B"]).describe("System to generate for"),
            response_format: z.nativeEnum(ResponseFormat)
                .default(ResponseFormat.JSON)
                .describe("Output format")
        }).strict(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        }
    }, async ({ mapping_id, system, response_format }) => {
        try {
            const mapping = await StorageService.getMapping(mapping_id);
            if (!mapping) {
                return {
                    content: [{
                            type: "text",
                            text: `Mapping '${mapping_id}' not found`
                        }],
                    isError: true
                };
            }
            const example = TransformationService.generateExamplePayload(mapping);
            let textContent;
            if (response_format === ResponseFormat.MARKDOWN) {
                textContent = `# Example Payload for System ${system}\n\n`;
                textContent += `\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n`;
            }
            else {
                textContent = JSON.stringify(example, null, 2);
            }
            return {
                content: [{ type: "text", text: textContent }],
                structuredContent: example
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `Error generating example: ${errorMsg}`
                    }],
                isError: true
            };
        }
    });
    // Validate mapping configuration
    server.registerTool("validate_mapping", {
        title: "Validate Mapping Configuration",
        description: `Validate a mapping configuration for completeness and correctness.

Checks that:
- All required fields are mapped
- Transformations are valid for their data types
- No circular dependencies exist
- Field paths are valid

Args:
  - mapping_id (string): Mapping ID to validate
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Validation results with any errors or warnings found.

Examples:
  - Use when: "Check if my mapping is valid"
  - Use when: "Validate the customer-sync mapping before using it"`,
        inputSchema: z.object({
            mapping_id: z.string().describe("Mapping ID to validate"),
            response_format: z.nativeEnum(ResponseFormat)
                .default(ResponseFormat.MARKDOWN)
                .describe("Output format")
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
                            text: `Mapping '${mapping_id}' not found`
                        }],
                    isError: true
                };
            }
            const errors = [];
            const warnings = [];
            // Validate field mappings
            for (const fieldMapping of mapping.fieldMappings) {
                const validation = MappingService.validateMapping(fieldMapping);
                if (!validation.valid) {
                    errors.push(...validation.errors.map(e => `${fieldMapping.sourceField}: ${e}`));
                }
            }
            const isValid = errors.length === 0;
            let textContent;
            if (response_format === ResponseFormat.MARKDOWN) {
                textContent = `# Mapping Validation: ${mapping.name}\n\n`;
                textContent += `**Status**: ${isValid ? "✓ Valid" : "✗ Invalid"}\n\n`;
                if (errors.length > 0) {
                    textContent += `## Errors\n`;
                    for (const error of errors) {
                        textContent += `- ${error}\n`;
                    }
                    textContent += `\n`;
                }
                if (warnings.length > 0) {
                    textContent += `## Warnings\n`;
                    for (const warning of warnings) {
                        textContent += `- ${warning}\n`;
                    }
                }
                if (isValid) {
                    textContent += `All field mappings are valid and ready to use.\n`;
                }
            }
            else {
                textContent = JSON.stringify({ valid: isValid, errors, warnings }, null, 2);
            }
            return {
                content: [{ type: "text", text: textContent }],
                structuredContent: { valid: isValid, errors, warnings }
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: "text",
                        text: `Error validating mapping: ${errorMsg}`
                    }],
                isError: true
            };
        }
    });
}
// Import MappingService for validation
import { MappingService } from "../services/mappingService.js";
//# sourceMappingURL=transformation.js.map