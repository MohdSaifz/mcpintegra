import type { SchemaMapping, StoredMapping } from "../types/index.js";
/**
 * Service for persisting and retrieving schema mappings
 *
 * Stores mappings as JSON file in the MCP server's working directory.
 * Falls back to in-memory storage if file system is read-only.
 */
export declare class StorageService {
    private static storage;
    private static initialized;
    private static fileSystemWritable;
    /**
     * Get the full path to the storage file in the working directory
     */
    private static getStoragePath;
    /**
     * Initialize storage by loading from file if it exists
     */
    private static initialize;
    /**
     * Load all mappings from storage
     */
    static loadMappings(): Promise<StoredMapping>;
    /**
     * Save all mappings to storage
     */
    static saveMappings(mappings: StoredMapping): Promise<void>;
    /**
     * Get a specific mapping by ID
     */
    static getMapping(id: string): Promise<SchemaMapping | null>;
    /**
     * Save a new mapping or update existing one
     */
    static saveMapping(mapping: SchemaMapping): Promise<void>;
    /**
     * Delete a mapping
     */
    static deleteMapping(id: string): Promise<boolean>;
    /**
     * List all mapping IDs and names
     */
    static listMappings(): Promise<Array<{
        id: string;
        name: string;
        description?: string;
    }>>;
    /**
     * Search mappings by endpoint
     */
    static findMappingsByEndpoint(system: "A" | "B", path: string, method?: string): Promise<SchemaMapping[]>;
    /**
     * Clear cache (useful for testing)
     */
    static clearCache(): void;
    /**
     * Export mappings as JSON
     */
    static exportMappings(): Promise<string>;
    /**
     * Import mappings from JSON
     */
    static importMappings(json: string): Promise<{
        imported: number;
        errors: string[];
    }>;
    /**
     * Validate mapping structure
     */
    private static validateMappingStructure;
}
//# sourceMappingURL=storageService.d.ts.map