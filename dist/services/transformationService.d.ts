import type { SchemaMapping, PayloadTransformResult } from "../types/index.js";
/**
 * Service for transforming payloads between schemas
 */
export declare class TransformationService {
    /**
     * Transform payload from source to target using mapping
     */
    static transformPayload(sourcePayload: Record<string, unknown>, mapping: SchemaMapping): PayloadTransformResult;
    /**
     * Apply transformation rule to a value
     */
    private static applyTransformation;
    /**
     * Apply format transformation (type conversion)
     */
    private static applyFormatTransformation;
    /**
     * Get nested value from object using dot-notation path (e.g., "user.address.city")
     * FIX: Added guard for undefined/empty path
     */
    private static getNestedValue;
    /**
     * Set nested value in object using dot-notation path
     * FIX: Added guard for undefined/empty path
     */
    private static setNestedValue;
    /**
     * Validate transformed payload against target schema
     */
    static validateTransformedPayload(payload: Record<string, unknown>, mapping: SchemaMapping): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Generate example payload based on schema
     */
    static generateExamplePayload(mapping: SchemaMapping): Record<string, unknown>;
}
//# sourceMappingURL=transformationService.d.ts.map