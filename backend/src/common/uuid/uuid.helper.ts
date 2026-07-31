import { v7 as uuidv7 } from 'uuid';

/**
 * Centralized UUID generator function for the entire application.
 * Strictly generates UUID v7.
 */
export function generateUuid(): string {
  return uuidv7();
}
