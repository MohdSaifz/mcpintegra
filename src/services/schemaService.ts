import axios from "axios";
import type { APISchema, EndpointSchema, SchemaObject } from "../types/index.js";

/**
 * Service for loading and parsing API schemas
 */
export class SchemaService {
  /**
   * Load schema from OpenAPI/Swagger specification
   */
  static async loadOpenAPISchema(url: string): Promise<APISchema> {
    try {
      const response = await axios.get(url);
      const spec = response.data;
      
      return this.parseOpenAPISpec(spec);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to load OpenAPI schema from ${url}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse OpenAPI specification into internal schema format
   */
  static parseOpenAPISpec(spec: any): APISchema {
    const endpoints: EndpointSchema[] = [];
    
    for (const [path, pathItem] of Object.entries(spec.paths || {})) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (typeof operation !== "object" || !operation || method === "parameters") continue;
        
        const op = operation as Record<string, unknown>;
        endpoints.push({
          path,
          method: method.toUpperCase(),
          description: (op.description as string) || (op.summary as string),
          parameters: this.parseParameters((op.parameters as any[]) || []),
          requestBody: op.requestBody 
            ? this.parseRequestBody(op.requestBody)
            : undefined,
          responses: (op.responses as any) || {}
        });
      }
    }

    return {
      endpoints,
      baseUrl: spec.servers?.[0]?.url,
      version: spec.info?.version,
      authentication: this.parseAuth(spec.components?.securitySchemes)
    };
  }

  /**
   * Parse schema from JSON object
   */
  static parseJSONSchema(schema: any): APISchema {
    // If it's already in our format
    if (schema.endpoints) {
      return schema as APISchema;
    }

    // Try to detect and parse various schema formats
    if (schema.openapi || schema.swagger) {
      return this.parseOpenAPISpec(schema);
    }

    // Custom format - try to infer structure
    const endpoints: EndpointSchema[] = [];
    
    if (schema.paths) {
      for (const [path, methods] of Object.entries(schema.paths)) {
        for (const [method, def] of Object.entries(methods as any)) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            description: (def as any).description,
            requestBody: (def as any).body || (def as any).schema,
            responses: (def as any).responses
          });
        }
      }
    }

    return {
      endpoints,
      baseUrl: schema.baseUrl,
      version: schema.version
    };
  }

  /**
   * Extract schema from endpoint definition
   */
  static extractSchemaFromEndpoint(endpoint: any): SchemaObject | undefined {
    if (!endpoint) return undefined;

    // Handle request body
    if (endpoint.requestBody?.content) {
      const content = endpoint.requestBody.content;
      const jsonContent = content["application/json"] || content["*/*"];
      if (jsonContent?.schema) {
        return this.normalizeSchema(jsonContent.schema);
      }
    }

    // Handle direct schema
    if (endpoint.schema) {
      return this.normalizeSchema(endpoint.schema);
    }

    return undefined;
  }

  /**
   * Normalize schema object to consistent format
   */
  static normalizeSchema(schema: any): SchemaObject {
    const normalized: SchemaObject = {
      type: schema.type || "object",
      description: schema.description,
      properties: {},
      required: schema.required || []
    };

    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        normalized.properties![key] = this.normalizeSchema(prop);
      }
    }

    if (schema.items) {
      normalized.items = this.normalizeSchema(schema.items);
    }

    // Copy additional properties
    if (schema.format) normalized.format = schema.format;
    if (schema.enum) normalized.enum = schema.enum;
    if (schema.example) normalized.example = schema.example;
    if (schema.default) normalized.default = schema.default;
    if (schema.minimum !== undefined) normalized.minimum = schema.minimum;
    if (schema.maximum !== undefined) normalized.maximum = schema.maximum;
    if (schema.minLength !== undefined) normalized.minLength = schema.minLength;
    if (schema.maxLength !== undefined) normalized.maxLength = schema.maxLength;
    if (schema.pattern) normalized.pattern = schema.pattern;

    return normalized;
  }

  /**
   * Parse parameters from OpenAPI format
   */
  private static parseParameters(params: any[]): any[] {
    return params.map(p => ({
      name: p.name,
      in: p.in,
      description: p.description,
      required: p.required || false,
      schema: this.normalizeSchema(p.schema || { type: "string" })
    }));
  }

  /**
   * Parse request body
   */
  private static parseRequestBody(body: any): SchemaObject | undefined {
    const content = body.content?.["application/json"];
    if (content?.schema) {
      return this.normalizeSchema(content.schema);
    }
    return undefined;
  }

  /**
   * Parse authentication configuration
   */
  private static parseAuth(securitySchemes: any): any {
    if (!securitySchemes) return undefined;
    
    const firstScheme = Object.values(securitySchemes)[0] as any;
    if (!firstScheme) return undefined;

    return {
      type: firstScheme.type,
      scheme: firstScheme.scheme,
      in: firstScheme.in,
      name: firstScheme.name
    };
  }

  /**
   * Get all field paths from a schema (flattened)
   */
  static getFieldPaths(schema: SchemaObject, prefix = ""): string[] {
    const paths: string[] = [];

    if (schema.type === "object" && schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        paths.push(fieldPath);
        
        if (prop.type === "object" || prop.type === "array") {
          paths.push(...this.getFieldPaths(prop, fieldPath));
        }
      }
    } else if (schema.type === "array" && schema.items) {
      const arrayPath = prefix ? `${prefix}[]` : "[]";
      paths.push(arrayPath);
      paths.push(...this.getFieldPaths(schema.items, arrayPath));
    }

    return paths;
  }

  /**
   * Compare two schemas for similarity
   */
  static compareSchemas(schema1: SchemaObject, schema2: SchemaObject): number {
    const fields1 = this.getFieldPaths(schema1);
    const fields2 = this.getFieldPaths(schema2);
    
    const common = fields1.filter(f => fields2.includes(f)).length;
    const total = new Set([...fields1, ...fields2]).size;
    
    return total > 0 ? common / total : 0;
  }
}