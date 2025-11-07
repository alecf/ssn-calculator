/**
 * Scenario Storage Layer
 *
 * Manages scenario persistence using IndexedDB via idb-keyval.
 * All data stays in the browser - no server communication.
 */

import { get, set, del, keys, clear } from 'idb-keyval';
import type { Scenario } from '@/types/scenario';
import { ScenarioSchema } from '@/lib/validation/schemas';

const STORAGE_PREFIX = 'scenario:';
const SCENARIO_LIST_KEY = 'scenario-list';

/**
 * Get the storage key for a scenario
 */
function getScenarioKey(id: string): string {
  return `${STORAGE_PREFIX}${id}`;
}

/**
 * Get list of all scenario IDs
 */
async function getScenarioIds(): Promise<string[]> {
  const ids = await get<string[]>(SCENARIO_LIST_KEY);
  return ids || [];
}

/**
 * Update the list of scenario IDs
 */
async function updateScenarioIds(ids: string[]): Promise<void> {
  await set(SCENARIO_LIST_KEY, ids);
}

/**
 * Save a scenario to IndexedDB
 *
 * @param scenario - Scenario to save
 * @throws Error if scenario is invalid
 */
export async function saveScenario(scenario: Scenario): Promise<void> {
  // Validate scenario before saving
  const validated = ScenarioSchema.parse(scenario);

  // Save the scenario
  await set(getScenarioKey(validated.id), validated);

  // Update the scenario list
  const ids = await getScenarioIds();
  if (!ids.includes(validated.id)) {
    await updateScenarioIds([...ids, validated.id]);
  }
}

/**
 * Get a scenario by ID
 *
 * @param id - Scenario ID
 * @returns Scenario or null if not found
 */
export async function getScenario(id: string): Promise<Scenario | null> {
  const scenario = await get<Scenario>(getScenarioKey(id));

  if (!scenario) {
    return null;
  }

  try {
    // Validate and parse dates (IndexedDB stores dates as strings)
    const parsed = ScenarioSchema.parse({
      ...scenario,
      createdAt: new Date(scenario.createdAt),
      updatedAt: new Date(scenario.updatedAt),
      birthDate: new Date(scenario.birthDate),
      spouseBirthDate: scenario.spouseBirthDate
        ? new Date(scenario.spouseBirthDate)
        : undefined,
    });
    return parsed;
  } catch (error) {
    console.error('Invalid scenario data:', error);
    return null;
  }
}

/**
 * Get all scenarios
 *
 * @returns Array of all saved scenarios
 */
export async function getAllScenarios(): Promise<Scenario[]> {
  const ids = await getScenarioIds();
  const scenarios: Scenario[] = [];

  for (const id of ids) {
    const scenario = await getScenario(id);
    if (scenario) {
      scenarios.push(scenario);
    }
  }

  // Sort by last updated (most recent first)
  return scenarios.sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

/**
 * Delete a scenario
 *
 * @param id - Scenario ID to delete
 */
export async function deleteScenario(id: string): Promise<void> {
  await del(getScenarioKey(id));

  // Update the scenario list
  const ids = await getScenarioIds();
  await updateScenarioIds(ids.filter((scenarioId) => scenarioId !== id));
}

/**
 * Update an existing scenario
 *
 * @param id - Scenario ID
 * @param updates - Partial scenario updates
 * @throws Error if scenario doesn't exist
 */
export async function updateScenario(
  id: string,
  updates: Partial<Scenario>
): Promise<void> {
  const existing = await getScenario(id);

  if (!existing) {
    throw new Error(`Scenario ${id} not found`);
  }

  const updated: Scenario = {
    ...existing,
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: new Date(),
  };

  await saveScenario(updated);
}

/**
 * Clear all scenarios
 *
 * WARNING: This deletes all saved data!
 */
export async function clearAllScenarios(): Promise<void> {
  const ids = await getScenarioIds();

  for (const id of ids) {
    await del(getScenarioKey(id));
  }

  await set(SCENARIO_LIST_KEY, []);
}

/**
 * Export scenarios as JSON
 *
 * @returns JSON string of all scenarios
 */
export async function exportScenarios(): Promise<string> {
  const scenarios = await getAllScenarios();
  return JSON.stringify(scenarios, null, 2);
}

/**
 * Import scenarios from JSON
 *
 * @param json - JSON string of scenarios
 * @returns Number of scenarios imported
 */
export async function importScenarios(json: string): Promise<number> {
  try {
    const scenarios = JSON.parse(json) as Scenario[];

    for (const scenario of scenarios) {
      await saveScenario(scenario);
    }

    return scenarios.length;
  } catch (error) {
    console.error('Failed to import scenarios:', error);
    throw new Error('Invalid scenario data');
  }
}
