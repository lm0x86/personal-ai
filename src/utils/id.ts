// ID prefixes for each entity type
export const ID_PREFIX = {
  task: 'tsk',
  event: 'evt',
  reminder: 'rem',
  person: 'per',
  place: 'plc',
  document: 'doc',
  memory: 'mem',
  project: 'prj',
} as const;

export type IdPrefix = typeof ID_PREFIX[keyof typeof ID_PREFIX];

// Generate a unique ID with prefix
export function generateId(prefix: IdPrefix): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
}

