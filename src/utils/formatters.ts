import type { APISchema, SchemaMapping, SchemaObject } from "../types/index.js";

/**
 * Format schema as Markdown
 */
export function formatSchemaAsMarkdown(schema: APISchema, systemName: string): string {
  let output = `# ${systemName} API Schema\n\n`;

  if (schema.baseUrl) {
    output += `**Base URL**: ${schema.baseUrl}\n`;
  }
  if (schema.version) {
    output += `**Version**: ${schema.version}\n`;
  }

  output += `**Endpoints**: ${schema.endpoints.length}\n\n`;

  if (schema.authentication) {
    output += `## Authentication\n`;
    output += `- **Type**: ${schema.authentication.type}\n`;
    if (schema.authentication.scheme) {
      output += `- **Scheme**: ${schema.authentication.scheme}\n`;
    }
    output += `\n`;
  }

  output += `## Endpoints\n\n`;

  for (const endpoint of schema.endpoints) {
    output += `### ${endpoint.method} ${endpoint.path}\n`;
    
    if (endpoint.description) {
      output += `${endpoint.description}\n\n`;
    }

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      output += `**Parameters**:\n`;
      for (const param of endpoint.parameters) {
        output += `- \`${param.name}\` (${param.in})`;
        if (param.required) output += ` *required*`;
        if (param.description) output += `: ${param.description}`;
        output += `\n`;
      }
      output += `\n`;
    }

    if (endpoint.requestBody) {
      output += `**Request Body**:\n`;
      output += formatSchemaObjectMarkdown(endpoint.requestBody, 1);
      output += `\n`;
    }

    output += `\n`;
  }

  return output;
}

/**
 * Format schema object as markdown with indentation
 */
function formatSchemaObjectMarkdown(schema: SchemaObject, indent: number): string {
  const spaces = "  ".repeat(indent);
  let output = `${spaces}- Type: \`${schema.type}\`\n`;

  if (schema.description) {
    output += `${spaces}  Description: ${schema.description}\n`;
  }

  if (schema.properties && Object.keys(schema.properties).length > 0) {
    output += `${spaces}  Properties:\n`;
    for (const [key, prop] of Object.entries(schema.properties)) {
      output += `${spaces}    - **${key}**:\n`;
      output += formatSchemaObjectMarkdown(prop, indent + 2);
    }
  }

  if (schema.items) {
    output += `${spaces}  Items:\n`;
    output += formatSchemaObjectMarkdown(schema.items, indent + 1);
  }

  return output;
}

/**
 * Format schema as JSON
 */
export function formatSchemaAsJSON(schema: APISchema): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Format mapping as markdown
 */
export function formatMappingsAsMarkdown(suggestions: any[]): string {
  let output = `# Mapping Suggestions\n\n`;
  output += `Found ${suggestions.length} potential mappings:\n\n`;

  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];
    output += `## ${i + 1}. ${suggestion.sourceField} → ${suggestion.targetField}\n`;
    output += `- **Confidence**: ${(suggestion.confidence * 100).toFixed(1)}%\n`;
    output += `- **Reasoning**: ${suggestion.reasoning}\n`;
    
    if (suggestion.suggestedTransformation) {
      output += `- **Transformation**: ${suggestion.suggestedTransformation.type}\n`;
    }
    
    output += `\n`;
  }

  return output;
}

/**
 * Format mapping as JSON
 */
export function formatMappingAsJSON(mapping: SchemaMapping): string {
  return JSON.stringify(mapping, null, 2);
}

/**
 * Truncate text if it exceeds character limit
 */
export function truncateText(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }

  const truncated = text.substring(0, limit - 100);
  return `${truncated}\n\n... [Truncated - content exceeds ${limit} characters]`;
}