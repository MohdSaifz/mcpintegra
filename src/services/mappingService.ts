import type {
  SchemaObject,
  FieldMapping,
  MappingSuggestion,
  TransformationRule
} from "../types/index.js";
import { DataType } from "../types/index.js";
import { FIELD_SYNONYMS, DEFAULT_CONFIDENCE_THRESHOLD } from "../constants.js";

/**
 * Service for intelligent schema mapping and field matching
 */
export class MappingService {
  /**
   * Suggest field mappings between two schemas using semantic matching
   */
  static suggestMappings(
    sourceSchema: SchemaObject,
    targetSchema: SchemaObject,
    confidenceThreshold: number = DEFAULT_CONFIDENCE_THRESHOLD
  ): MappingSuggestion[] {
    const suggestions: MappingSuggestion[] = [];
    
    const sourceFields = this.extractFields(sourceSchema);
    const targetFields = this.extractFields(targetSchema);

    for (const sourceField of sourceFields) {
      for (const targetField of targetFields) {
        const confidence = this.calculateFieldSimilarity(
          sourceField.path,
          targetField.path,
          sourceField.schema,
          targetField.schema
        );

        if (confidence >= confidenceThreshold) {
          const transformation = this.suggestTransformation(
            sourceField.schema,
            targetField.schema
          );

          suggestions.push({
            confidence,
            sourceField: sourceField.path,
            targetField: targetField.path,
            reasoning: this.generateReasoning(sourceField, targetField, confidence),
            suggestedTransformation: transformation
          });
        }
      }
    }

    // Sort by confidence descending
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate similarity between two field names and types
   */
  private static calculateFieldSimilarity(
    sourceName: string,
    targetName: string,
    sourceSchema: SchemaObject,
    targetSchema: SchemaObject
  ): number {
    let score = 0;

    // Exact match
    if (sourceName === targetName) {
      score += 0.5;
    }

    // Case-insensitive match
    if (sourceName.toLowerCase() === targetName.toLowerCase()) {
      score += 0.3;
    }

    // Normalize names (remove underscores, hyphens)
    const normalizedSource = this.normalizeName(sourceName);
    const normalizedTarget = this.normalizeName(targetName);

    if (normalizedSource === normalizedTarget) {
      score += 0.2;
    }

    // Check synonyms
    const synonymScore = this.checkSynonyms(normalizedSource, normalizedTarget);
    score += synonymScore * 0.3;

    // Substring matching
    if (normalizedSource.includes(normalizedTarget) || normalizedTarget.includes(normalizedSource)) {
      score += 0.1;
    }

    // Type compatibility
    const typeScore = this.calculateTypeCompatibility(sourceSchema.type, targetSchema.type);
    score += typeScore * 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Normalize field name for comparison
   */
  private static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[-_]/g, "")
      .replace(/\[\]/g, "");
  }

  /**
   * Check if two names are synonyms
   */
  private static checkSynonyms(name1: string, name2: string): number {
    for (const synonyms of Object.values(FIELD_SYNONYMS)) {
      const normalizedSynonyms = (synonyms as string[]).map(s => this.normalizeName(s));
      
      if (normalizedSynonyms.includes(name1) && normalizedSynonyms.includes(name2)) {
        return 1.0;
      }
    }
    return 0.0;
  }

  /**
   * Calculate type compatibility score
   */
  private static calculateTypeCompatibility(type1: DataType, type2: DataType): number {
    if (type1 === type2) return 1.0;

    // Compatible types
    if ((type1 === DataType.NUMBER && type2 === DataType.INTEGER) ||
        (type1 === DataType.INTEGER && type2 === DataType.NUMBER)) {
      return 0.7;
    }

    if ((type1 === DataType.STRING && type2 === DataType.NULL) ||
        (type1 === DataType.NULL && type2 === DataType.STRING)) {
      return 0.7;
    }

    return 0.0;
  }

  /**
   * Suggest transformation rule if needed
   */
  private static suggestTransformation(
    sourceSchema: SchemaObject,
    targetSchema: SchemaObject
  ): TransformationRule | undefined {
    // Direct mapping if types match
    if (sourceSchema.type === targetSchema.type) {
      return { type: "direct" };
    }

    // Format conversion
    if (sourceSchema.type === "string" && targetSchema.type === "number") {
      return {
        type: "format",
        params: { from: "string", to: "number" },
        function: "parseFloat"
      };
    }

    if (sourceSchema.type === "number" && targetSchema.type === "string") {
      return {
        type: "format",
        params: { from: "number", to: "string" },
        function: "toString"
      };
    }

    // Date format conversion
    if (sourceSchema.format === "date" && targetSchema.format === "date-time") {
      return {
        type: "format",
        params: { from: "date", to: "date-time" }
      };
    }

    // Array to string (join)
    if (sourceSchema.type === "array" && targetSchema.type === "string") {
      return {
        type: "join",
        params: { separator: ", " }
      };
    }

    // String to array (split)
    if (sourceSchema.type === "string" && targetSchema.type === "array") {
      return {
        type: "split",
        params: { separator: "," }
      };
    }

    return undefined;
  }

  /**
   * Generate human-readable reasoning for mapping suggestion
   */
  private static generateReasoning(
    sourceField: { path: string; schema: SchemaObject },
    targetField: { path: string; schema: SchemaObject },
    confidence: number
  ): string {
    const reasons: string[] = [];

    const normalizedSource = this.normalizeName(sourceField.path);
    const normalizedTarget = this.normalizeName(targetField.path);

    if (sourceField.path === targetField.path) {
      reasons.push("Exact field name match");
    } else if (normalizedSource === normalizedTarget) {
      reasons.push("Field names match after normalization");
    }

    if (sourceField.schema.type === targetField.schema.type) {
      reasons.push("Same data type");
    } else {
      reasons.push(`Type conversion needed: ${sourceField.schema.type} → ${targetField.schema.type}`);
    }

    if (this.checkSynonyms(normalizedSource, normalizedTarget) > 0) {
      reasons.push("Field names are synonyms");
    }

    reasons.push(`Confidence: ${(confidence * 100).toFixed(1)}%`);

    return reasons.join("; ");
  }

  /**
   * Extract all fields from schema with their paths
   */
  private static extractFields(
    schema: SchemaObject,
    prefix = ""
  ): Array<{ path: string; schema: SchemaObject }> {
    const fields: Array<{ path: string; schema: SchemaObject }> = [];

    if (schema.type === "object" && schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        fields.push({ path: fieldPath, schema: prop });

        if (prop.type === "object" || prop.type === "array") {
          fields.push(...this.extractFields(prop, fieldPath));
        }
      }
    } else if (schema.type === "array" && schema.items) {
      const arrayPath = prefix ? `${prefix}[]` : "[]";
      fields.push(...this.extractFields(schema.items, arrayPath));
    }

    return fields;
  }

  /**
   * Create field mapping from suggestion
   */
  static createFieldMapping(suggestion: MappingSuggestion): FieldMapping {
    return {
      sourceField: suggestion.sourceField,
      targetField: suggestion.targetField,
      sourceType: DataType.STRING, // Would be determined from schema
      targetType: DataType.STRING,
      transformation: suggestion.suggestedTransformation,
      required: false,
      description: suggestion.reasoning
    };
  }

  /**
   * Validate field mapping
   */
  static validateMapping(mapping: FieldMapping): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!mapping.sourceField) {
      errors.push("Source field is required");
    }

    if (!mapping.targetField) {
      errors.push("Target field is required");
    }

    if (!mapping.sourceType) {
      errors.push("Source type is required");
    }

    if (!mapping.targetType) {
      errors.push("Target type is required");
    }

    // Check if transformation is needed but not provided
    if (mapping.sourceType !== mapping.targetType && !mapping.transformation) {
      errors.push(`Type mismatch requires transformation: ${mapping.sourceType} → ${mapping.targetType}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}