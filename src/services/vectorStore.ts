import { config } from '../config.js';
import { BaseEntity, EntityType, INDEX_NAMES } from '../types/entities.js';

interface SearchOptions {
  query?: string;
  filters?: Record<string, unknown>;
  limit?: number;
  type?: 'hybrid' | 'openai_dense' | 'bge_m3_dense' | 'bge_m3_sparse';
}

interface SearchResult<T> {
  results: T[];
  total: number;
}

class VectorStoreService {
  private baseUrl: string;
  private apiKey: string;
  private indexPrefix: string;

  constructor() {
    this.baseUrl = config.vectorStore.baseUrl;
    this.apiKey = config.vectorStore.apiKey;
    this.indexPrefix = config.indexPrefix;
  }

  private getIndexName(entityType: EntityType): string {
    return `${this.indexPrefix}${INDEX_NAMES[entityType]}`;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
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
    const index = this.getIndexName(entityType);
    const now = new Date().toISOString();
    
    const payload = {
      index,
      id: entity.id,
      title: entity.title,
      description: entity.description || '',
      ...entity,
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
    const index = this.getIndexName(entityType);
    
    const response = await fetch(
      `${this.baseUrl}/product?index=${encodeURIComponent(index)}&id=${encodeURIComponent(id)}`,
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

    const data = await response.json();
    return data as T;
  }

  // Get multiple entities by IDs
  async getMany<T extends BaseEntity>(
    entityType: EntityType,
    ids: string[]
  ): Promise<T[]> {
    if (ids.length === 0) return [];
    
    const index = this.getIndexName(entityType);
    const idsParam = ids.join(',');
    
    const response = await fetch(
      `${this.baseUrl}/product?index=${encodeURIComponent(index)}&id=${encodeURIComponent(idsParam)}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get ${entityType}s: ${error}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  }

  // Delete entity
  async delete(entityType: EntityType, ids: string[]): Promise<void> {
    const index = this.getIndexName(entityType);
    
    const response = await fetch(`${this.baseUrl}/product`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ index, ids }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete ${entityType}: ${error}`);
    }
  }

  // Search entities
  async search<T extends BaseEntity>(
    entityType: EntityType,
    options: SearchOptions
  ): Promise<SearchResult<T>> {
    const index = this.getIndexName(entityType);
    
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        index,
        query: options.query,
        filters: options.filters,
        limit: options.limit || 10,
        type: options.type || 'hybrid',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to search ${entityType}: ${error}`);
    }

    const data = await response.json();
    return {
      results: data.results || data || [],
      total: data.total || (data.results || data || []).length,
    };
  }

  // Search across multiple entity types
  async searchAll(
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
  async getStats(entityType: EntityType): Promise<{ total: number; hasData: boolean }> {
    const index = this.getIndexName(entityType);
    
    const response = await fetch(`${this.baseUrl}/stats/${encodeURIComponent(index)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      // Index might not exist yet
      return { total: 0, hasData: false };
    }

    const data = await response.json();
    return {
      total: data.total_products || 0,
      hasData: data.has_data || false,
    };
  }
}

// Export singleton instance
export const vectorStore = new VectorStoreService();

