import { Router, Request, Response } from 'express';
import { vectorStore } from '../services/vectorStore.js';
import { BaseEntity, EntityType } from '../types/entities.js';
import { generateId, IdPrefix } from '../utils/id.js';

interface RouterOptions {
  entityType: EntityType;
  idPrefix: IdPrefix;
  // Validation function for required fields
  validate?: (body: Record<string, unknown>) => { valid: boolean; error?: string };
}

export function createEntityRouter<T extends BaseEntity>(options: RouterOptions): Router {
  const router = Router();
  const { entityType, idPrefix, validate } = options;

  // GET / - List/search entities
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { q, limit = '10', ...filters } = req.query;
      
      // Parse limit safely (could be string or number)
      const parsedLimit = typeof limit === 'string' 
        ? parseInt(limit, 10) || 10 
        : (typeof limit === 'number' ? limit : 10);
      
      // Filter out empty string values from filters
      const cleanFilters: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== '' && value !== undefined && value !== null) {
          cleanFilters[key] = value;
        }
      }
      
      const result = await vectorStore.search<T>(entityType, {
        query: q as string,
        filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
        limit: parsedLimit,
      });

      res.json(result);
    } catch (error) {
      console.error(`Error listing ${entityType}s:`, error);
      res.status(500).json({ error: `Failed to list ${entityType}s` });
    }
  });

  // GET /:id - Get single entity
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const entity = await vectorStore.get<T>(entityType, req.params.id);
      
      if (!entity) {
        res.status(404).json({ error: `${entityType} not found` });
        return;
      }

      res.json(entity);
    } catch (error) {
      console.error(`Error getting ${entityType}:`, error);
      res.status(500).json({ error: `Failed to get ${entityType}` });
    }
  });

  // POST / - Create entity
  router.post('/', async (req: Request, res: Response) => {
    try {
      const body = req.body;

      // Validate required fields
      if (!body.title) {
        res.status(400).json({ error: 'title is required' });
        return;
      }

      // Custom validation
      if (validate) {
        const validation = validate(body);
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }
      }

      const entity: T = {
        ...body,
        id: body.id || generateId(idPrefix),
      };

      const created = await vectorStore.upsert<T>(entityType, entity);
      res.status(201).json(created);
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error);
      res.status(500).json({ error: `Failed to create ${entityType}` });
    }
  });

  // PUT /:id - Update entity
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const existing = await vectorStore.get<T>(entityType, req.params.id);
      
      if (!existing) {
        res.status(404).json({ error: `${entityType} not found` });
        return;
      }

      const updated: T = {
        ...existing,
        ...req.body,
        id: req.params.id, // Ensure ID doesn't change
      };

      const result = await vectorStore.upsert<T>(entityType, updated);
      res.json(result);
    } catch (error) {
      console.error(`Error updating ${entityType}:`, error);
      res.status(500).json({ error: `Failed to update ${entityType}` });
    }
  });

  // PATCH /:id - Partial update
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const existing = await vectorStore.get<T>(entityType, req.params.id);
      
      if (!existing) {
        res.status(404).json({ error: `${entityType} not found` });
        return;
      }

      const updated: T = {
        ...existing,
        ...req.body,
        id: req.params.id,
      };

      const result = await vectorStore.upsert<T>(entityType, updated);
      res.json(result);
    } catch (error) {
      console.error(`Error updating ${entityType}:`, error);
      res.status(500).json({ error: `Failed to update ${entityType}` });
    }
  });

  // DELETE /:id - Delete entity
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await vectorStore.delete(entityType, [req.params.id]);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
      res.status(500).json({ error: `Failed to delete ${entityType}` });
    }
  });

  return router;
}

