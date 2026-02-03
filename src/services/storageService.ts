import { promises as fs } from "fs";
import path from "path";
import type { SchemaMapping, StoredMapping } from "../types/index.js";
import { MAPPING_STORAGE_PATH } from "../constants.js";

/**
 * Service for persisting and retrieving schema mappings
 * 
 * Stores mappings as JSON file in the MCP server's working directory.
 * Falls back to in-memory storage if file system is read-only.
 */
export class StorageService {
  // In-memory cache for mappings
  private static storage: StoredMapping = {};
  private static initialized = false;
  private static fileSystemWritable = true;
  
  /**
   * Get the full path to the storage file in the working directory
   */
  private static getStoragePath(): string {
    return path.join(process.cwd(), MAPPING_STORAGE_PATH);
  }

  /**
   * Initialize storage by loading from file if it exists
   */
  private static async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const storagePath = this.getStoragePath();
      const data = await fs.readFile(storagePath, "utf-8");
      this.storage = JSON.parse(data);
      console.log(`✓ Loaded mappings from ${storagePath}`);
    } catch (error) {
      // File doesn't exist or can't be read, start with empty storage
      if (error instanceof Error && (error as any).code === "ENOENT") {
        console.log("No existing mappings file, starting with empty storage");
      } else {
        console.log("Could not load mappings from file, using in-memory storage");
      }
      this.storage = {};
    }
  }

  /**
   * Load all mappings from storage
   */
  static async loadMappings(): Promise<StoredMapping> {
    await this.initialize();
    return this.storage;
  }

  /**
   * Save all mappings to storage
   */
  static async saveMappings(mappings: StoredMapping): Promise<void> {
    // Always update in-memory cache
    this.storage = mappings;

    // Try to persist to file
    if (!this.fileSystemWritable) {
      console.log("File system is read-only, mappings stored in memory only");
      return;
    }

    try {
      const storagePath = this.getStoragePath();
      const data = JSON.stringify(mappings, null, 2);
      await fs.writeFile(storagePath, data, "utf-8");
      console.log(`✓ Saved mappings to ${storagePath}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Check if it's a read-only file system error
      if (errorMsg.includes("EROFS") || errorMsg.includes("read-only")) {
        this.fileSystemWritable = false;
        console.warn("⚠ File system is read-only, mappings stored in memory only");
      } else {
        console.warn(`⚠ Warning: Could not save mappings to file: ${errorMsg}`);
      }
    }
  }

  /**
   * Get a specific mapping by ID
   */
  static async getMapping(id: string): Promise<SchemaMapping | null> {
    const mappings = await this.loadMappings();
    return mappings[id] || null;
  }

  /**
   * FIX: Normalize a single field mapping entry so that both snake_case
   * (source_field / target_field) and camelCase (sourceField / targetField)
   * input keys are accepted and stored consistently as camelCase.
   */
  private static normalizeFieldMapping(fm: any): any {
    return {
      sourceField:    fm.sourceField    ?? fm.source_field,
      targetField:    fm.targetField    ?? fm.target_field,
      transformation: fm.transformation ?? null,
      confidence:     fm.confidence     ?? null,
      required:       fm.required       ?? false,
      sourceType:     fm.sourceType     ?? fm.source_type     ?? undefined,
      targetType:     fm.targetType     ?? fm.target_type     ?? undefined,
    };
  }

  /**
   * Save a new mapping or update existing one
   * FIX: Normalize fieldMappings keys before persisting
   */
  static async saveMapping(mapping: SchemaMapping): Promise<void> {
    const mappings = await this.loadMappings();

    // Normalize field mapping keys (snake_case → camelCase)
    if (Array.isArray(mapping.fieldMappings)) {
      mapping.fieldMappings = mapping.fieldMappings.map(fm => this.normalizeFieldMapping(fm));
    }

    // Update timestamp
    mapping.updatedAt = new Date().toISOString();
    
    if (!mapping.createdAt) {
      mapping.createdAt = mapping.updatedAt;
    }

    mappings[mapping.id] = mapping;
    await this.saveMappings(mappings);
  }

  /**
   * Delete a mapping
   */
  static async deleteMapping(id: string): Promise<boolean> {
    const mappings = await this.loadMappings();
    
    if (mappings[id]) {
      delete mappings[id];
      await this.saveMappings(mappings);
      return true;
    }
    
    return false;
  }

  /**
   * List all mapping IDs and names
   */
  static async listMappings(): Promise<Array<{ id: string; name: string; description?: string }>> {
    const mappings = await this.loadMappings();
    
    return Object.values(mappings).map(m => ({
      id: m.id,
      name: m.name,
      description: m.description
    }));
  }

  /**
   * Search mappings by endpoint
   */
  static async findMappingsByEndpoint(
    system: "A" | "B",
    path: string,
    method?: string
  ): Promise<SchemaMapping[]> {
    const mappings = await this.loadMappings();
    
    return Object.values(mappings).filter(m => {
      const endpoint = system === "A" ? m.sourceEndpoint : m.targetEndpoint;
      
      if (endpoint.path !== path) return false;
      if (method && endpoint.method !== method) return false;
      
      return true;
    });
  }

  /**
   * Clear cache (useful for testing)
   */
  static clearCache(): void {
    this.storage = {};
    this.initialized = false;
  }

  /**
   * Export mappings as JSON
   */
  static async exportMappings(): Promise<string> {
    const mappings = await this.loadMappings();
    return JSON.stringify(mappings, null, 2);
  }

  /**
   * Import mappings from JSON
   */
  static async importMappings(json: string): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    try {
      const data = JSON.parse(json);
      
      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid JSON format");
      }

      const mappings = await this.loadMappings();

      for (const [id, mapping] of Object.entries(data)) {
        try {
          // Validate mapping structure
          if (!this.validateMappingStructure(mapping as any)) {
            errors.push(`Invalid mapping structure for ID: ${id}`);
            continue;
          }

          // FIX: Normalize field mappings on import as well
          const normalizedMapping = mapping as any;
          if (Array.isArray(normalizedMapping.fieldMappings)) {
            normalizedMapping.fieldMappings = normalizedMapping.fieldMappings.map(
              (fm: any) => this.normalizeFieldMapping(fm)
            );
          }

          mappings[id] = normalizedMapping as SchemaMapping;
          imported++;
        } catch (error) {
          errors.push(`Failed to import mapping ${id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      await this.saveMappings(mappings);

      return { imported, errors };
    } catch (error) {
      errors.push(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
      return { imported: 0, errors };
    }
  }

  /**
   * Validate mapping structure
   * FIX: Now validates that each fieldMapping entry has sourceField/targetField
   *      (accepts both snake_case and camelCase variants)
   */
  private static validateMappingStructure(mapping: any): boolean {
    if (
      !mapping ||
      typeof mapping.id !== "string" ||
      typeof mapping.name !== "string" ||
      !mapping.sourceEndpoint ||
      !mapping.targetEndpoint ||
      !Array.isArray(mapping.fieldMappings)
    ) {
      return false;
    }

    // Validate each field mapping has the required keys
    for (const fm of mapping.fieldMappings) {
      const sourceField = fm.sourceField ?? fm.source_field;
      const targetField = fm.targetField ?? fm.target_field;
      if (!sourceField || !targetField) {
        return false;
      }
    }

    return true;
  }
}