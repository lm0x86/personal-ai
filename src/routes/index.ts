import { Router } from 'express';
import { createEntityRouter } from './createEntityRouter.js';
import { searchRouter } from './search.js';
import { entitiesRouter } from './entities.js';
import { ID_PREFIX } from '../utils/id.js';
import { Task, Event, Reminder, Person, Place, Document, Memory, Project, Thing, Organization } from '../types/entities.js';

const router = Router();

// Tasks
router.use('/tasks', createEntityRouter<Task>({
  entityType: 'task',
  idPrefix: ID_PREFIX.task,
}));

// Events (require start_time)
router.use('/events', createEntityRouter<Event>({
  entityType: 'event',
  idPrefix: ID_PREFIX.event,
  validate: (body) => {
    if (!body.start_time) {
      return { valid: false, error: 'start_time is required for events' };
    }
    return { valid: true };
  },
}));

// Reminders (require remind_at)
router.use('/reminders', createEntityRouter<Reminder>({
  entityType: 'reminder',
  idPrefix: ID_PREFIX.reminder,
  validate: (body) => {
    if (!body.remind_at) {
      return { valid: false, error: 'remind_at is required for reminders' };
    }
    return { valid: true };
  },
}));

// People
router.use('/people', createEntityRouter<Person>({
  entityType: 'person',
  idPrefix: ID_PREFIX.person,
}));

// Places
router.use('/places', createEntityRouter<Place>({
  entityType: 'place',
  idPrefix: ID_PREFIX.place,
}));

// Documents
router.use('/documents', createEntityRouter<Document>({
  entityType: 'document',
  idPrefix: ID_PREFIX.document,
}));

// Memories
router.use('/memories', createEntityRouter<Memory>({
  entityType: 'memory',
  idPrefix: ID_PREFIX.memory,
}));

// Projects
router.use('/projects', createEntityRouter<Project>({
  entityType: 'project',
  idPrefix: ID_PREFIX.project,
}));

// Things (valuable objects, possessions)
router.use('/things', createEntityRouter<Thing>({
  entityType: 'thing',
  idPrefix: ID_PREFIX.thing,
}));

// Organizations (companies, businesses, institutions)
router.use('/organizations', createEntityRouter<Organization>({
  entityType: 'organization',
  idPrefix: ID_PREFIX.organization,
}));

// Unified search
router.use('/search', searchRouter);

// Unified entity operations (get by ID, delete by ID)
router.use('/entities', entitiesRouter);

export { router };

