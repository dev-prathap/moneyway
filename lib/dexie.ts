import Dexie, { Table } from 'dexie';
import { Pass } from './models/pass';

export interface PendingOperation {
  id?: number;
  type: 'create-pass' | 'update-pass' | 'create-event' | 'update-status';
  passId?: string;
  eventId?: string;
  payload: any;
  createdAt: Date;
  retryCount: number;
}

export interface Event {
  eventId: string;
  name: string;
  date: Date;
  templateId: string;
  totalPasses: number;
  usedPasses: number;
  createdAt: Date;
}

export class ManiwyPassDB extends Dexie {
  passes!: Table<Pass, string>;
  pendingOps!: Table<PendingOperation, number>;
  events!: Table<Event, string>;

  constructor() {
    super('ManiwyPassDB');
    
    this.version(1).stores({
      passes: 'passId, eventId, status, mobile',
      pendingOps: '++id, type, passId, createdAt',
      events: 'eventId, date'
    });
  }
}

// Create singleton instance
export const db = new ManiwyPassDB();

// Helper functions for offline operations
export async function cachePass(pass: Pass): Promise<void> {
  await db.passes.put(pass);
}

export async function cachePasses(passes: Pass[]): Promise<void> {
  await db.passes.bulkPut(passes);
}

export async function getPassFromCache(passId: string): Promise<Pass | undefined> {
  return await db.passes.get(passId);
}

export async function searchPassesInCache(query: { passId?: string; mobile?: string }): Promise<Pass[]> {
  if (query.passId) {
    const pass = await db.passes.get(query.passId);
    return pass ? [pass] : [];
  }
  
  if (query.mobile) {
    return await db.passes.where('mobile').equals(query.mobile).toArray();
  }
  
  return [];
}

export async function queueOperation(operation: Omit<PendingOperation, 'id'>): Promise<number> {
  return await db.pendingOps.add(operation);
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  return await db.pendingOps.orderBy('createdAt').toArray();
}

export async function getPendingOperationsCount(): Promise<number> {
  return await db.pendingOps.count();
}

export async function removePendingOperation(id: number): Promise<void> {
  await db.pendingOps.delete(id);
}

export async function updatePendingOperationRetryCount(id: number, retryCount: number): Promise<void> {
  await db.pendingOps.update(id, { retryCount });
}

export async function cacheEvent(event: Event): Promise<void> {
  await db.events.put(event);
}

export async function getEventFromCache(eventId: string): Promise<Event | undefined> {
  return await db.events.get(eventId);
}

export async function getAllEventsFromCache(): Promise<Event[]> {
  return await db.events.orderBy('date').reverse().toArray();
}

// Offline detection
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function addOnlineListener(callback: () => void): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', callback);
  }
}

export function addOfflineListener(callback: () => void): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('offline', callback);
  }
}

export function removeOnlineListener(callback: () => void): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', callback);
  }
}

export function removeOfflineListener(callback: () => void): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('offline', callback);
  }
}
