// Type definitions for schema mapping

export enum ResponseFormat {
  JSON = "json",
  MARKDOWN = "markdown"
}

export enum DataType {
  STRING = "string",
  NUMBER = "number",
  INTEGER = "integer",
  BOOLEAN = "boolean",
  ARRAY = "array",
  OBJECT = "object",
  NULL = "null"
}

export interface APISchema {
  endpoints: EndpointSchema[];
  baseUrl?: string;
  version?: string;
  authentication?: AuthenticationConfig;
  metadata?: Record<string, unknown>;
}

export interface EndpointSchema {
  path: string;
  method: string;
  description?: string;
  parameters?: ParameterSchema[];
  requestBody?: SchemaObject;
  responses?: Record<string, ResponseSchema>;
}

export interface ParameterSchema {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  description?: string;
  required?: boolean;
  schema: SchemaObject;
}

export interface SchemaObject {
  type: DataType;
  format?: string;
  description?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  enum?: unknown[];
  example?: unknown;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface ResponseSchema {
  description?: string;
  content?: Record<string, { schema: SchemaObject }>;
  schema?: SchemaObject;
}

export interface AuthenticationConfig {
  type: "bearer" | "api-key" | "basic" | "oauth2";
  scheme?: string;
  in?: "header" | "query";
  name?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  sourceType: DataType;
  targetType: DataType;
  transformation?: TransformationRule;
  required: boolean;
  description?: string;
}

export interface TransformationRule {
  type: "direct" | "format" | "split" | "join" | "lookup" | "custom";
  params?: Record<string, unknown>;
  function?: string;
}

export interface SchemaMapping {
  id: string;
  name: string;
  description?: string;
  sourceEndpoint: EndpointReference;
  targetEndpoint: EndpointReference;
  fieldMappings: FieldMapping[];
  validationRules?: ValidationRule[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface EndpointReference {
  system: "A" | "B";
  path: string;
  method: string;
}

export interface ValidationRule {
  field: string;
  type: "required" | "format" | "range" | "custom";
  params?: Record<string, unknown>;
  errorMessage?: string;
}

export interface MappingSuggestion {
  confidence: number;
  sourceField: string;
  targetField: string;
  reasoning: string;
  suggestedTransformation?: TransformationRule;
}

export interface PayloadTransformResult {
  success: boolean;
  transformedPayload?: Record<string, unknown>;
  errors?: TransformationError[];
  warnings?: string[];
  unmappedFields?: string[];
}

export interface TransformationError {
  field: string;
  error: string;
  originalValue?: unknown;
}

export interface StoredMapping {
  [key: string]: SchemaMapping;
}