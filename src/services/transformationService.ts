import type {
  SchemaMapping,
  FieldMapping,
  PayloadTransformResult,
  TransformationError
} from "../types/index.js";

/**
 * Service for transforming payloads between schemas
 */
export class TransformationService {
  /**
   * Transform payload from source to target using mapping
   */
  static transformPayload(
    sourcePayload: Record<string, unknown>,
    mapping: SchemaMapping
  ): PayloadTransformResult {
    const errors: TransformationError[] = [];
    const warnings: string[] = [];
    const unmappedFields: string[] = [];
    const transformedPayload: Record<string, unknown> = {};

    // Track which source fields are mapped
    const mappedSourceFields = new Set(
      mapping.fieldMappings.map(m => m.sourceField)
    );

    // Find unmapped source fields
    for (const key of Object.keys(sourcePayload)) {
      if (!mappedSourceFields.has(key)) {
        unmappedFields.push(key);
      }
    }

    // Apply each field mapping
    for (const fieldMapping of mapping.fieldMappings) {
      try {
        // FIX: Validate that sourceField and targetField are defined before proceeding
        if (!fieldMapping.sourceField || !fieldMapping.targetField) {
          errors.push({
            field: fieldMapping.sourceField ?? "undefined",
            error: `Invalid field mapping: sourceField='${fieldMapping.sourceField}', targetField='${fieldMapping.targetField}'. ` +
              `Check that the mapping was saved with valid field names.`
          });
          continue;
        }

        const value = this.getNestedValue(sourcePayload, fieldMapping.sourceField);

        // Check if required field is missing
        if (fieldMapping.required && (value === undefined || value === null)) {
          errors.push({
            field: fieldMapping.sourceField,
            error: "Required field is missing or null"
          });
          continue;
        }

        // Skip if value is undefined and not required
        if (value === undefined) {
          continue;
        }

        // Apply transformation if specified
        let transformedValue: unknown = value;
        if (fieldMapping.transformation) {
          try {
            transformedValue = this.applyTransformation(
              value,
              fieldMapping.transformation
            );
          } catch (error) {
            errors.push({
              field: fieldMapping.sourceField,
              error: `Transformation failed: ${error instanceof Error ? error.message : String(error)}`,
              originalValue: value
            });
            continue;
          }
        }

        // Set the transformed value in target
        this.setNestedValue(
          transformedPayload,
          fieldMapping.targetField,
          transformedValue
        );
      } catch (error) {
        errors.push({
          field: fieldMapping.sourceField ?? "undefined",
          error: `Failed to transform field: ${error instanceof Error ? error.message : String(error)}`,
          originalValue: fieldMapping.sourceField ? this.getNestedValue(sourcePayload, fieldMapping.sourceField) : undefined
        });
      }
    }

    // Add warnings for unmapped fields
    if (unmappedFields.length > 0) {
      warnings.push(`Unmapped source fields: ${unmappedFields.join(", ")}`);
    }

    return {
      success: errors.length === 0,
      transformedPayload: errors.length === 0 ? transformedPayload : undefined,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      unmappedFields: unmappedFields.length > 0 ? unmappedFields : undefined
    };
  }

  /**
   * Apply transformation rule to a value
   */
  private static applyTransformation(
    value: unknown,
    transformation: FieldMapping["transformation"]
  ): unknown {
    if (!transformation) return value;

    switch (transformation.type) {
      case "direct":
        return value;

      case "format":
        return this.applyFormatTransformation(value, transformation);

      case "split":
        if (typeof value !== "string") {
          throw new Error("Split transformation requires string input");
        }
        const separator = transformation.params?.separator as string || ",";
        return value.split(separator).map(s => s.trim());

      case "join":
        if (!Array.isArray(value)) {
          throw new Error("Join transformation requires array input");
        }
        const joinSeparator = transformation.params?.separator as string || ", ";
        return value.join(joinSeparator);

      case "lookup":
        const lookupTable = transformation.params?.table as Record<string, unknown>;
        if (!lookupTable) {
          throw new Error("Lookup transformation requires lookup table");
        }
        return lookupTable[String(value)] ?? value;

      case "custom":
        if (!transformation.function) {
          throw new Error("Custom transformation requires function");
        }
        // In production, this would execute user-defined transformation logic
        // For safety, we'd use a sandboxed environment
        throw new Error("Custom transformations not yet implemented");

      default:
        return value;
    }
  }

  /**
   * Apply format transformation (type conversion)
   */
  private static applyFormatTransformation(
    value: unknown,
    transformation: FieldMapping["transformation"]
  ): unknown {
    const params = transformation!.params || {};
    const from = params.from as string;
    const to = params.to as string;

    // String to number
    if (from === "string" && to === "number") {
      const num = parseFloat(String(value));
      if (isNaN(num)) {
        throw new Error(`Cannot convert '${value}' to number`);
      }
      return num;
    }

    // Number to string
    if (from === "number" && to === "string") {
      return String(value);
    }

    // String to boolean
    if (from === "string" && to === "boolean") {
      const strValue = String(value).toLowerCase();
      if (["true", "1", "yes", "on"].includes(strValue)) return true;
      if (["false", "0", "no", "off"].includes(strValue)) return false;
      throw new Error(`Cannot convert '${value}' to boolean`);
    }

    // Boolean to string
    if (from === "boolean" && to === "string") {
      return value ? "true" : "false";
    }

    // Date format conversions
    if (from === "date" && to === "date-time") {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${value}`);
      }
      return date.toISOString();
    }

    if (from === "date-time" && to === "date") {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date-time: ${value}`);
      }
      return date.toISOString().split("T")[0];
    }

    return value;
  }

  /**
   * Get nested value from object using dot-notation path (e.g., "user.address.city")
   * FIX: Added guard for undefined/empty path
   */
  private static getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    if (!path) {
      throw new Error("Field path is undefined or empty");
    }

    const parts = path.split(".");
    let current: any = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Set nested value in object using dot-notation path
   * FIX: Added guard for undefined/empty path
   */
  private static setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void {
    if (!path) {
      throw new Error("Field path is undefined or empty");
    }

    const parts = path.split(".");
    let current: any = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Validate transformed payload against target schema
   */
  static validateTransformedPayload(
    payload: Record<string, unknown>,
    mapping: SchemaMapping
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    const requiredFields = mapping.fieldMappings
      .filter(m => m.required)
      .map(m => m.targetField);

    for (const field of requiredFields) {
      const value = this.getNestedValue(payload, field);
      if (value === undefined || value === null) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Run validation rules if defined
    if (mapping.validationRules) {
      for (const rule of mapping.validationRules) {
        const value = this.getNestedValue(payload, rule.field);
        
        if (rule.type === "required" && (value === undefined || value === null)) {
          errors.push(rule.errorMessage || `Field '${rule.field}' is required`);
        }

        if (rule.type === "format" && value !== undefined) {
          const pattern = rule.params?.pattern as string;
          if (pattern && !new RegExp(pattern).test(String(value))) {
            errors.push(
              rule.errorMessage || `Field '${rule.field}' does not match required format`
            );
          }
        }

        if (rule.type === "range" && typeof value === "number") {
          const min = rule.params?.min as number | undefined;
          const max = rule.params?.max as number | undefined;
          
          if (min !== undefined && value < min) {
            errors.push(
              rule.errorMessage || `Field '${rule.field}' must be at least ${min}`
            );
          }
          
          if (max !== undefined && value > max) {
            errors.push(
              rule.errorMessage || `Field '${rule.field}' must be at most ${max}`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate example payload based on schema
   */
  static generateExamplePayload(mapping: SchemaMapping): Record<string, unknown> {
    const example: Record<string, unknown> = {};

    for (const fieldMapping of mapping.fieldMappings) {
      let exampleValue: unknown;

      switch (fieldMapping.sourceType) {
        case "string":
          exampleValue = `example_${fieldMapping.sourceField}`;
          break;
        case "number":
        case "integer":
          exampleValue = 123;
          break;
        case "boolean":
          exampleValue = true;
          break;
        case "array":
          exampleValue = ["item1", "item2"];
          break;
        case "object":
          exampleValue = { key: "value" };
          break;
        default:
          exampleValue = null;
      }

      if (fieldMapping.sourceField) {
        this.setNestedValue(example, fieldMapping.sourceField, exampleValue);
      }
    }

    return example;
  }
}