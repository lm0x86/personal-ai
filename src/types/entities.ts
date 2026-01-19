// Base entity that all types extend
export interface BaseEntity {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Task - something to do
export interface Task extends BaseEntity {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  person_id?: string;
  place_id?: string;
  project_id?: string;
  document_id?: string;
}

// Event - calendar item with specific time
export interface Event extends BaseEntity {
  start_time: string; // Required - ISO datetime
  end_time?: string;
  all_day?: boolean;
  person_id?: string;
  place_id?: string;
  project_id?: string;
  recurring?: string; // e.g., "daily", "weekly", "monthly"
  location?: string; // Physical location/address for the event
  google_calendar_id?: string; // Google Calendar event ID for sync
}

// Reminder - time-triggered notification
export interface Reminder extends BaseEntity {
  remind_at: string; // Required - ISO datetime
  related_id?: string;
  related_type?: EntityType;
  recurring?: string;
  snoozed_until?: string;
}

// Person - contact
export interface Person extends BaseEntity {
  phone?: string;
  email?: string;
  relationship?: string; // e.g., "friend", "colleague", "landlord", "doctor"
  company?: string;
  address?: string;
  birthday?: string;
  notes?: string;
}

// Place - physical location
export interface Place extends BaseEntity {
  address?: string;
  coordinates?: { lat: number; lng: number };
  person_id?: string; // e.g., owner, contact person
  type?: string; // e.g., "home", "office", "warehouse", "restaurant"
  notes?: string;
}

// Document - important papers, contracts, files
export interface Document extends BaseEntity {
  type?: string; // e.g., "contract", "agreement", "receipt", "id"
  expires?: string;
  status?: 'active' | 'expired' | 'pending' | 'archived';
  file_url?: string;
  person_id?: string;
  place_id?: string;
}

// Memory - notes, facts, ideas
export interface Memory extends BaseEntity {
  category?: string; // e.g., "idea", "fact", "preference", "instruction"
  tags?: string[];
  importance?: 'low' | 'medium' | 'high';
  related_id?: string;
  related_type?: EntityType;
}

// Project - grouping for related items
export interface Project extends BaseEntity {
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  deadline?: string;
  goal?: string;
}

// Thing - valuable objects, possessions, assets
export interface Thing extends BaseEntity {
  category?: string; // e.g., "electronics", "vehicle", "jewelry", "furniture", "tool"
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  warranty_expires?: string;
  condition?: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  location?: string; // Where it's stored/kept
  place_id?: string; // Link to a Place
  person_id?: string; // Owner or responsible person
  notes?: string;
}

// Organization - companies, businesses, institutions
export interface Organization extends BaseEntity {
  type?: string; // e.g., "company", "ngo", "government", "bank", "supplier", "client"
  industry?: string; // e.g., "technology", "finance", "healthcare", "retail"
  vat_number?: string;
  registration_number?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  place_id?: string; // Link to Place (headquarters/office)
  contact_person_id?: string; // Link to Person (main contact)
  employees?: number;
  founded?: string; // Year or date
  notes?: string;
}

// Entity type enum for references
export type EntityType = 
  | 'task' 
  | 'event' 
  | 'reminder' 
  | 'person' 
  | 'place' 
  | 'document' 
  | 'memory' 
  | 'project'
  | 'thing'
  | 'organization';

// Union type for any entity
export type Entity = Task | Event | Reminder | Person | Place | Document | Memory | Project | Thing | Organization;

// Create input types (id is auto-generated)
export type CreateTask = Omit<Task, 'id'> & { id?: string };
export type CreateEvent = Omit<Event, 'id'> & { id?: string };
export type CreateReminder = Omit<Reminder, 'id'> & { id?: string };
export type CreatePerson = Omit<Person, 'id'> & { id?: string };
export type CreatePlace = Omit<Place, 'id'> & { id?: string };
export type CreateDocument = Omit<Document, 'id'> & { id?: string };
export type CreateMemory = Omit<Memory, 'id'> & { id?: string };
export type CreateProject = Omit<Project, 'id'> & { id?: string };
export type CreateThing = Omit<Thing, 'id'> & { id?: string };
export type CreateOrganization = Omit<Organization, 'id'> & { id?: string };

