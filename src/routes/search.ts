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
];

// Extended type that includes search score
interface SearchResultItem extends BaseEntity {
  _type: EntityType;
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

    // Determine which entity types to search
    const entityTypes: EntityType[] = types && types.length > 0
      ? types.filter((t: string) => ALL_ENTITY_TYPES.includes(t as EntityType))
      : ALL_ENTITY_TYPES;

    // Search across all requested types
    const results = await vectorStore.searchAll(entityTypes, {
      query,
      filters,
      limit,
      type: search_type,
    });

    // Flatten results with type information
    const flatResults: SearchResultItem[] = entityTypes.flatMap((entityType) => {
      const typeResults = results[entityType]?.results || [];
      return typeResults.map((item) => ({
        ...item,
        _type: entityType,
      } as SearchResultItem));
    });

    // Sort by relevance score if available, otherwise by updated_at
    flatResults.sort((a, b) => {
      if (a._score !== undefined && b._score !== undefined) {
        return b._score - a._score;
      }
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bTime - aTime;
    });

    res.json({
      query,
      types: entityTypes,
      total: flatResults.length,
      results: flatResults.slice(0, limit),
      by_type: results,
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

    // Parse types if provided
    const entityTypes: EntityType[] = types
      ? (types as string).split(',').filter((t) => ALL_ENTITY_TYPES.includes(t as EntityType)) as EntityType[]
      : ALL_ENTITY_TYPES;

    const results = await vectorStore.searchAll(entityTypes, {
      query: q as string,
      limit: parseInt(limit as string, 10),
    });

    // Flatten results
    const flatResults: SearchResultItem[] = entityTypes.flatMap((entityType) => {
      const typeResults = results[entityType]?.results || [];
      return typeResults.map((item) => ({
        ...item,
        _type: entityType,
      } as SearchResultItem));
    });

    res.json({
      query: q,
      types: entityTypes,
      total: flatResults.length,
      results: flatResults.slice(0, parseInt(limit as string, 10)),
    });
  } catch (error) {
    console.error('Error in unified search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
