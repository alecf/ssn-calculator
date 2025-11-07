/**
 * User Preferences Storage Layer
 *
 * Manages user preferences that persist across sessions, such as:
 * - Birth date (global app setting)
 *
 * Uses IndexedDB via idb-keyval for persistence.
 */

import { get, set, del } from 'idb-keyval';

const BIRTHDATE_KEY = 'user-birthdate';
const SPOUSE_BIRTHDATE_KEY = 'user-spouse-birthdate';
const INCLUDE_SPOUSE_KEY = 'user-include-spouse';

/**
 * Load the user's birth date from storage
 *
 * @returns Date if found, null otherwise
 */
export async function loadBirthdate(): Promise<Date | null> {
  try {
    const stored = await get<string>(BIRTHDATE_KEY);
    if (!stored) {
      return null;
    }
    return new Date(stored);
  } catch (error) {
    console.error('Failed to load birthdate from storage:', error);
    return null;
  }
}

/**
 * Save the user's birth date to storage
 *
 * @param date - Birth date to save
 */
export async function saveBirthdate(date: Date): Promise<void> {
  try {
    await set(BIRTHDATE_KEY, date.toISOString());
  } catch (error) {
    console.error('Failed to save birthdate:', error);
    throw error;
  }
}

/**
 * Load the spouse's birth date from storage
 *
 * @returns Date if found, null otherwise
 */
export async function loadSpouseBirthdate(): Promise<Date | null> {
  try {
    const stored = await get<string>(SPOUSE_BIRTHDATE_KEY);
    if (!stored) {
      return null;
    }
    return new Date(stored);
  } catch (error) {
    console.error('Failed to load spouse birthdate from storage:', error);
    return null;
  }
}

/**
 * Save the spouse's birth date to storage
 *
 * @param date - Spouse birth date to save
 */
export async function saveSpouseBirthdate(date: Date): Promise<void> {
  try {
    await set(SPOUSE_BIRTHDATE_KEY, date.toISOString());
  } catch (error) {
    console.error('Failed to save spouse birthdate:', error);
    throw error;
  }
}

/**
 * Load whether spouse is included in calculations
 *
 * @returns boolean indicating if spouse is included
 */
export async function loadIncludeSpouse(): Promise<boolean> {
  try {
    const stored = await get<boolean>(INCLUDE_SPOUSE_KEY);
    return stored ?? false;
  } catch (error) {
    console.error('Failed to load include spouse setting:', error);
    return false;
  }
}

/**
 * Save whether spouse is included in calculations
 *
 * @param include - Whether to include spouse
 */
export async function saveIncludeSpouse(include: boolean): Promise<void> {
  try {
    await set(INCLUDE_SPOUSE_KEY, include);
  } catch (error) {
    console.error('Failed to save include spouse setting:', error);
    throw error;
  }
}

/**
 * Clear all preferences
 */
export async function clearAllPreferences(): Promise<void> {
  try {
    await del(BIRTHDATE_KEY);
    await del(SPOUSE_BIRTHDATE_KEY);
    await del(INCLUDE_SPOUSE_KEY);
  } catch (error) {
    console.error('Failed to clear preferences:', error);
    throw error;
  }
}
