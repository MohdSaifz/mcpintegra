import type { SchemaObject, FieldMapping, MappingSuggestion } from "../types/index.js";
/**
 * Service for intelligent schema mapping and field matching
 */
export declare class MappingService {
    /**
     * Suggest field mappings between two schemas using semantic matching
     */
    static suggestMappings(sourceSchema: SchemaObject, targetSchema: SchemaObject, confidenceThreshold?: number): MappingSuggestion[];
    /**
     * Calculate similarity between two field names and types
     */
    private static calculateFieldSimilarity;
    /**
     * Normalize field name for comparison
     */
    private static normalizeName;
    /**
     * Check if two names are synonyms
     */
    private static checkSynonyms;
    /**
     * Calculate type compatibility score
     */
    private static calculateTypeCompatibility;
    /**
     * Suggest transformation rule if needed
     */
    private static suggestTransformation;
    /**
     * Generate human-readable reasoning for mapping suggestion
     */
    private static generateReasoning;
    /**
     * Extract all fields from schema with their paths
     */
    private static extractFields;
    /**
     * Create field mapping from suggestion
     */
    static createFieldMapping(suggestion: MappingSuggestion): FieldMapping;
    /**
     * Validate field mapping
     */
    static validateMapping(mapping: FieldMapping): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=mappingService.d.ts.map