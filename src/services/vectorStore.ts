import { config } from '../config.js';
import { BaseEntity, EntityType } from '../types/entities.js';

interface SearchOptions {
  query?: string;
  filters?: Record<string, unknown>;
  limit?: number;
  searchType?: 'hybrid' | 'openai_dense' | 'bge_m3_dense' | 'bge_m3_sparse';
}

interface SearchResult<T> {
  results: T[];
  total: number;
}

interface ApiSearchResponse {
  results?: unknown[];
  total?: number;
}

interface ApiStatsResponse {
  total_products?: number;
  has_data?: boolean;
}

class VectorStoreService {
  private baseUrl: string;
  private apiKey: string;
  private indexName: string;

  constructor() {
    this.baseUrl = config.vectorStore.baseUrl;
    this.apiKey = config.vectorStore.apiKey;
    this.indexName = config.indexName || 'default_index';
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  // Generate a unique ID
  generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}${random}`;
  }

  // Create or update an entity
  async upsert<T extends BaseEntity>(
    entityType: EntityType,
    entity: T
  ): Promise<T> {
    const now = new Date().toISOString();
    
    const payload = {
      ...entity,
      index: this.indexName,
      id: entity.id,
      title: entity.title,
      description: entity.description || '',
      entity_type: entityType,  // Store type in the entity
      updated_at: now,
      created_at: entity.created_at || now,
    };

    const response = await fetch(`${this.baseUrl}/product`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upsert ${entityType}: ${error}`);
    }

    return payload as T;
  }

  // Get entity by ID
  async get<T extends BaseEntity>(
    entityType: EntityType,
    id: string
  ): Promise<T | null> {
    const response = await fetch(
      `${this.baseUrl}/product?index=${encodeURIComponent(this.indexName)}&id=${encodeURIComponent(id)}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.text();
      throw new Error(`Failed to get ${entityType}: ${error}`);
    }

    const data = await response.json() as T;
    return data;
  }

  // Get multiple entities by IDs
  async getMany<T extends BaseEntity>(
    entityType: EntityType,
    ids: string[]
  ): Promise<T[]> {
    if (ids.length === 0) return [];
    
    const idsParam = ids.join(',');
    
    const response = await fetch(
      `${this.baseUrl}/product?index=${encodeURIComponent(this.indexName)}&id=${encodeURIComponent(idsParam)}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get ${entityType}s: ${error}`);
    }

    const data = await response.json() as T | T[];
    return Array.isArray(data) ? data : [data];
  }

  // Delete entity
  async delete(entityType: EntityType, ids: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/product`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ index: this.indexName, ids }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete ${entityType}: ${error}`);
    }
  }

  // Search entities of a specific type
  async search<T extends BaseEntity>(
    entityType: EntityType,
    options: SearchOptions
  ): Promise<SearchResult<T>> {
    // Merge entity_type filter with any provided filters
    const filters = {
      ...options.filters,
      entity_type: entityType,
    };
    
    // Lowercase query for case-insensitive search
    const query = options.query?.toLowerCase();
    
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        index: this.indexName,
        query,
        filters,
        limit: options.limit || 10,
        type: options.searchType || 'hybrid',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to search ${entityType}: ${error}`);
    }

    const data = await response.json() as ApiSearchResponse;
    const results = (data.results || data || []) as T[];
    return {
      results,
      total: data.total || results.length,
    };
  }

  // Search all entities (no type filter)
  async searchAllTypes(
    options: SearchOptions
  ): Promise<SearchResult<BaseEntity>> {
    // Lowercase query for case-insensitive search
    const query = options.query?.toLowerCase();
    
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        index: this.indexName,
        query,
        filters: options.filters,
        limit: options.limit || 10,
        type: options.searchType || 'hybrid',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to search: ${error}`);
    }

    const data = await response.json() as ApiSearchResponse;
    const results = (data.results || data || []) as BaseEntity[];
    return {
      results,
      total: data.total || results.length,
    };
  }

  // Search across specific entity types (runs separate filtered searches)
  async searchByTypes(
    entityTypes: EntityType[],
    options: SearchOptions
  ): Promise<Record<EntityType, SearchResult<BaseEntity>>> {
    const results: Record<string, SearchResult<BaseEntity>> = {};
    
    // Run searches in parallel
    await Promise.all(
      entityTypes.map(async (entityType) => {
        results[entityType] = await this.search(entityType, options);
      })
    );

    return results as Record<EntityType, SearchResult<BaseEntity>>;
  }

  // Get index statistics
  async getStats(): Promise<{ total: number; hasData: boolean }> {
    const response = await fetch(`${this.baseUrl}/stats/${encodeURIComponent(this.indexName)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      // Index might not exist yet
      return { total: 0, hasData: false };
    }

    const data = await response.json() as ApiStatsResponse;
    return {
      total: data.total_products || 0,
      hasData: data.has_data || false,
    };
  }
}

// Export singleton instance
export const vectorStore = new VectorStoreService();
