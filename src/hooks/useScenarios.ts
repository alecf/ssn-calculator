/**
 * Scenarios Hook
 *
 * Manages scenario CRUD operations with IndexedDB persistence.
 */

'use client';

import { useState, useEffect } from 'react';
import type { Scenario } from '@/types/scenario';
import {
  getAllScenarios,
  saveScenario,
  deleteScenario as deleteScenarioStorage,
  updateScenario as updateScenarioStorage,
} from '@/lib/storage/scenarios';

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loaded = await getAllScenarios();
      setScenarios(loaded);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load scenarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const save = async (scenario: Scenario) => {
    try {
      setError(null);
      await saveScenario(scenario);

      // Optimistically update UI
      setScenarios((prev) => {
        const exists = prev.find((s) => s.id === scenario.id);
        if (exists) {
          return prev.map((s) => (s.id === scenario.id ? scenario : s));
        }
        return [scenario, ...prev];
      });
    } catch (err) {
      setError(err as Error);
      console.error('Failed to save scenario:', err);
      throw err;
    }
  };

  const update = async (id: string, updates: Partial<Scenario>) => {
    try {
      setError(null);
      await updateScenarioStorage(id, updates);

      // Optimistically update UI
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
        )
      );
    } catch (err) {
      setError(err as Error);
      console.error('Failed to update scenario:', err);
      throw err;
    }
  };

  const deleteScenario = async (id: string) => {
    try {
      setError(null);
      await deleteScenarioStorage(id);

      // Optimistically update UI
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err as Error);
      console.error('Failed to delete scenario:', err);
      throw err;
    }
  };

  return {
    scenarios,
    isLoading,
    error,
    save,
    update,
    deleteScenario,
    reload: loadScenarios,
  };
}
