import { Router, Request, Response } from 'express';
import { vectorStore } from '../services/vectorStore.js';
import { EntityType } from '../types/entities.js';
import { ID_PREFIX } from '../utils/id.js';

export const entitiesRouter = Router();

// Map prefixes to entity types
const PREFIX_TO_TYPE: Record<string, EntityType> = {
  [ID_PREFIX.task]: 'task',
  [ID_PREFIX.event]: 'event',
  [ID_PREFIX.reminder]: 'reminder',
  [ID_PREFIX.person]: 'person',
  [ID_PREFIX.place]: 'place',
  [ID_PREFIX.document]: 'document',
  [ID_PREFIX.memory]: 'memory',
  [ID_PREFIX.project]: 'project',
  [ID_PREFIX.thing]: 'thing',
  [ID_PREFIX.organization]: 'organization',
};

// Extract entity type from ID prefix
function getEntityTypeFromId(id: string): EntityType | null {
  const prefix = id.split('_')[0];
  return PREFIX_TO_TYPE[prefix] || null;
}

// DELETE /entities/:id - Unified delete endpoint
entitiesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const entityType = getEntityTypeFromId(id);
    if (!entityType) {
      res.status(400).json({ 
        error: 'Invalid ID format. Expected format: prefix_id (e.g., tsk_abc123)',
        valid_prefixes: Object.keys(PREFIX_TO_TYPE),
      });
      return;
    }

    await vectorStore.delete(entityType, [id]);
    res.json({ success: true, deleted: id, type: entityType });
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({ error: 'Failed to delete entity' });
  }
});

// POST /entities/delete - Unified delete (for webhooks that prefer POST)
entitiesRouter.post('/delete', async (req: Request, res: Response) => {
  try {
    const { id, ids } = req.body;
    
    // Support single ID or array of IDs
    const idsToDelete: string[] = ids || (id ? [id] : []);
    
    if (idsToDelete.length === 0) {
      res.status(400).json({ error: 'id or ids is required' });
      return;
    }

    const results: { deleted: string[]; errors: { id: string; error: string }[] } = {
      deleted: [],
      errors: [],
    };

    for (const itemId of idsToDelete) {
      const entityType = getEntityTypeFromId(itemId);
      if (!entityType) {
        results.errors.push({ id: itemId, error: 'Invalid ID format' });
        continue;
      }

      try {
        await vectorStore.delete(entityType, [itemId]);
        results.deleted.push(itemId);
      } catch (err) {
        results.errors.push({ id: itemId, error: 'Delete failed' });
      }
    }

    res.json({
      success: results.errors.length === 0,
      ...results,
    });
  } catch (error) {
    console.error('Error deleting entities:', error);
    res.status(500).json({ error: 'Failed to delete entities' });
  }
});

// GET /entities/:id - Unified get by ID
entitiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const entityType = getEntityTypeFromId(id);
    if (!entityType) {
      res.status(400).json({ 
        error: 'Invalid ID format',
        valid_prefixes: Object.keys(PREFIX_TO_TYPE),
      });
      return;
    }

    const entity = await vectorStore.get(entityType, id);
    
    if (!entity) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }

    res.json(entity);
  } catch (error) {
    console.error('Error getting entity:', error);
    res.status(500).json({ error: 'Failed to get entity' });
  }
});

