import { Router, Request, Response } from 'express';
import { vectorStore } from '../services/vectorStore.js';
import { EntityType, BaseEntity } from '../types/entities.js';

export const searchRouter = Router();

const ALL_ENTITY_TYPES: EntityType[] = [
  'task',
  'event',
  'reminder',
  'person',
  'place',
  'document',
  'memory',
  'project',
  'thing',
  'organization',
  'history',
];

// Extended type that includes search score and entity_type
interface SearchResultItem extends BaseEntity {
  entity_type?: EntityType;
  _score?: number;
}

// POST /search - Unified search across all or specific entity types
searchRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      query,
      types,
      filters,
      limit = 10,
      search_type = 'hybrid',
    } = req.body;

    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    // Normalize limit to number (could be string "10" or number 10)
    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) || 10 : (limit || 10);
    
    // Normalize filters (could be string or object)
    const parsedFilters = typeof filters === 'string' 
      ? (filters.length > 0 ? JSON.parse(filters) : undefined)
      : filters;

    // If specific types requested, search by types; otherwise search all
    // Handle types as string, array, or undefined
    let typesArray: string[] = [];
    if (Array.isArray(types)) {
      typesArray = types;
    } else if (typeof types === 'string' && types.length > 0) {
      typesArray = types.split(',').map((t: string) => t.trim());
    }
    
    const entityTypes: EntityType[] = typesArray
      .filter((t) => ALL_ENTITY_TYPES.includes(t as EntityType)) as EntityType[];

    let results: SearchResultItem[];

    if (entityTypes.length > 0) {
      // Search specific types
      const byTypeResults = await vectorStore.searchByTypes(entityTypes, {
        query,
        filters: parsedFilters,
        limit: parsedLimit,
        searchType: search_type,
      });

      // Flatten results
      results = entityTypes.flatMap((entityType) => {
        const typeResults = byTypeResults[entityType]?.results || [];
        return typeResults as SearchResultItem[];
      });
    } else {
      // Search ALL entities in single query (no type filter)
      const allResults = await vectorStore.searchAllTypes({
        query,
        filters: parsedFilters,
        limit: parsedLimit,
        searchType: search_type,
      });
      results = allResults.results as SearchResultItem[];
    }

    // Sort by relevance score if available, otherwise by updated_at
    results.sort((a, b) => {
      if (a._score !== undefined && b._score !== undefined) {
        return b._score - a._score;
      }
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bTime - aTime;
    });

    res.json({
      query,
      types: entityTypes.length > 0 ? entityTypes : 'all',
      total: results.length,
      results: results.slice(0, parsedLimit),
    });
  } catch (error) {
    console.error('Error in unified search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /search - Simple search via query params
searchRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { q, types, limit = '10' } = req.query;

    if (!q) {
      res.status(400).json({ error: 'q (query) parameter is required' });
      return;
    }

    const parsedLimit = parseInt(limit as string, 10);

    // Parse types if provided
    const entityTypes: EntityType[] = types
      ? (types as string).split(',').filter((t) => ALL_ENTITY_TYPES.includes(t as EntityType)) as EntityType[]
      : [];

    let results: SearchResultItem[];

    if (entityTypes.length > 0) {
      // Search specific types
      const byTypeResults = await vectorStore.searchByTypes(entityTypes, {
        query: q as string,
        limit: parsedLimit,
      });

      results = entityTypes.flatMap((entityType) => {
        const typeResults = byTypeResults[entityType]?.results || [];
        return typeResults as SearchResultItem[];
      });
    } else {
      // Search all
      const allResults = await vectorStore.searchAllTypes({
        query: q as string,
        limit: parsedLimit,
      });
      results = allResults.results as SearchResultItem[];
    }

    res.json({
      query: q,
      types: entityTypes.length > 0 ? entityTypes : 'all',
      total: results.length,
      results: results.slice(0, parsedLimit),
    });
  } catch (error) {
    console.error('Error in unified search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
