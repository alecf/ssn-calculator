/**
 * Social Security Calculator - Main Page
 *
 * Help users answer: "At what age should I start collecting Social Security?"
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IndividualInputs } from '@/components/calculator/IndividualInputs';
import { SpouseInputs } from '@/components/calculator/SpouseInputs';
import { AssumptionsPanel } from '@/components/calculator/AssumptionsPanel';
import { CumulativeBenefitsChart } from '@/components/charts/CumulativeBenefitsChart';
import { ScenarioCard } from '@/components/scenarios/ScenarioCard';
import { SettingsDialog } from '@/components/settings/BirthdateSettingsDialog';
import { createDefaultScenario, getSuggestedScenarioName } from '@/constants/defaults';
import { useScenarios } from '@/hooks/useScenarios';
import { useCalculations, useMultipleCalculations } from '@/hooks/useCalculations';
import { findBreakevenAge } from '@/lib/calculations/breakeven';
import { getBenefitAmountFeedback } from '@/lib/validation/feedback';
import { getMaxBenefit } from '@/constants/ssaRules';
import {
  loadBirthdate,
  saveBirthdate,
  loadSpouseBirthdate,
  saveSpouseBirthdate,
  loadIncludeSpouse,
  saveIncludeSpouse,
} from '@/lib/storage/preferences';
import { projectMaxBenefitAtFRA, calculateFRA } from '@/lib/calculations/ssaBenefits';
import type { Scenario } from '@/types/scenario';
import type { AssumptionPreset } from '@/constants/ssaRules';

export default function Home() {
  // Initialize with default scenario
  const defaultScenario = createDefaultScenario({ name: 'Current Scenario' });

  // Current scenario being edited
  const [currentScenario, setCurrentScenario] = useState<Scenario>(defaultScenario);

  // Track desired benefit as a percentage of projected max (this stays fixed when assumptions change)
  // When age/COLA changes, the dollar amount recalculates but percentage stays the same
  const [desiredBenefitPercentage, setDesiredBenefitPercentage] = useState(75); // Default to 75%

  // Track which scenario is being edited (if any) and if it's dirty
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [originalScenarioValues, setOriginalScenarioValues] = useState<Scenario | null>(null);

  // Saved scenarios
  const { scenarios, save, deleteScenario, update } = useScenarios();

  // Selected scenarios for comparison
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  // Welcome message visibility
  const [showWelcome, setShowWelcome] = useState(true);

  // Settings dialog visibility
  const [showSettings, setShowSettings] = useState(false);

  // Track if component has mounted (for hydration)
  const [isMounted, setIsMounted] = useState(false);

  // Global display mode (today's dollars vs future dollars)
  const [globalDisplayMode, setGlobalDisplayMode] = useState<'today-dollars' | 'future-dollars'>('today-dollars');

  // Chart type (cumulative vs monthly)
  const [chartType, setChartType] = useState<'cumulative' | 'monthly'>('cumulative');

  // Global spouse settings (persist across scenarios)
  const [globalSpouseBirthDate, setGlobalSpouseBirthDate] = useState<Date>(
    new Date(defaultScenario.birthDate.getFullYear() - 2, defaultScenario.birthDate.getMonth(), 15)
  );
  const [includeSpouseGlobally, setIncludeSpouseGlobally] = useState(false);

  // Clear all scenarios confirmation
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // Load birthdate preferences from storage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load user's birthdate preference
        const savedBirthdate = await loadBirthdate();
        if (savedBirthdate) {
          setCurrentScenario((prev) => ({
            ...prev,
            birthDate: savedBirthdate,
          }));
        }

        // Load spouse birthdate preference
        const savedSpouseBirthdate = await loadSpouseBirthdate();
        if (savedSpouseBirthdate) {
          setGlobalSpouseBirthDate(savedSpouseBirthdate);
        }

        // Load include spouse preference
        const savedIncludeSpouse = await loadIncludeSpouse();
        if (savedIncludeSpouse) {
          setIncludeSpouseGlobally(savedIncludeSpouse);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsMounted(true);
      }
    };

    loadPreferences();
  }, []);

  // Save birthdate preference whenever it changes
  useEffect(() => {
    if (!isMounted) return;

    try {
      saveBirthdate(currentScenario.birthDate).catch((error) => {
        console.error('Failed to save birthdate:', error);
      });
    } catch (error) {
      console.error('Failed to save birthdate:', error);
    }
  }, [currentScenario.birthDate, isMounted]);

  // Save spouse birthdate preference whenever it changes
  useEffect(() => {
    if (!isMounted) return;

    try {
      saveSpouseBirthdate(globalSpouseBirthDate).catch((error) => {
        console.error('Failed to save spouse birthdate:', error);
      });
    } catch (error) {
      console.error('Failed to save spouse birthdate:', error);
    }
  }, [globalSpouseBirthDate, isMounted]);

  // Save include spouse preference whenever it changes
  useEffect(() => {
    if (!isMounted) return;

    try {
      saveIncludeSpouse(includeSpouseGlobally).catch((error) => {
        console.error('Failed to save include spouse setting:', error);
      });
    } catch (error) {
      console.error('Failed to save include spouse setting:', error);
    }
  }, [includeSpouseGlobally, isMounted]);

  // Project the maximum benefit at the user's FRA, accounting for COLA increases
  const projectedMaxBenefit = projectMaxBenefitAtFRA(
    currentScenario.birthDate,
    currentScenario.colaRate
  );

  // Calculate expected benefit based on desired percentage of projected max
  // This allows the percentage to stay fixed while dollar amount updates as assumptions change
  const expectedBenefit = Math.round((projectedMaxBenefit * desiredBenefitPercentage) / 100);

  // Sync currentScenario.benefitAmount with the calculated expectedBenefit
  // This ensures that when the percentage changes, the scenario's benefitAmount is updated
  useEffect(() => {
    setCurrentScenario((prev) => ({
      ...prev,
      benefitAmount: expectedBenefit,
    }));
  }, [expectedBenefit]);

  // Create an updated scenario with the recalculated benefit
  const scenarioWithCalculatedBenefit: Scenario = {
    ...currentScenario,
    benefitAmount: expectedBenefit,
  };

  // Calculate current scenario using the calculated benefit amount
  const currentResults = useCalculations(scenarioWithCalculatedBenefit);

  // Calculate selected scenarios
  const selectedScenarioObjects = scenarios.filter((s) =>
    selectedScenarios.includes(s.id)
  );
  const selectedResults = useMultipleCalculations(selectedScenarioObjects);

  // Calculate breakevens for all pairs of selected scenarios
  const breakevens: Array<{ age: number; scenario1: string; scenario2: string }> = [];
  if (selectedResults.length >= 2) {
    for (let i = 0; i < selectedResults.length; i++) {
      for (let j = i + 1; j < selectedResults.length; j++) {
        const r1 = selectedResults[i];
        const r2 = selectedResults[j];
        const age = findBreakevenAge(
          r1.cumulativeBenefits,
          r2.cumulativeBenefits
        );
        if (age) {
          breakevens.push({
            age: Math.round(age),
            scenario1: r1.scenario.name,
            scenario2: r2.scenario.name,
          });
        }
      }
    }
    // Sort breakevens by age (earliest to latest)
    breakevens.sort((a, b) => a.age - b.age);
  }

  // Chart data
  // Always show currentScenario unless it's clean AND matches an existing saved scenario
  const currentScenarioMatchesSaved = editingScenarioId && !isDirty;
  const chartData = [
    ...(!currentScenarioMatchesSaved
      ? [
          {
            name: currentScenario.name,
            benefits: currentResults.cumulativeBenefits,
            yearlyBenefits: currentResults.yearlyBenefits,
            color: '#3b82f6',
            claimingAge: currentScenario.claimingAge,
            isCurrent: true,
            strokeWidth: 3,
          },
        ]
      : []),
    ...selectedResults.map((result, i) => ({
      name: result.scenario.name,
      benefits: result.cumulativeBenefits,
      yearlyBenefits: result.yearlyBenefits,
      color: ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][i] || '#06b6d4',
      claimingAge: result.scenario.claimingAge,
      isCurrent: false,
      strokeWidth: 2,
    })),
  ];

  // Calculate FRA year for display in feedback
  const fra = calculateFRA(currentScenario.birthDate);
  const fraAge = fra.years + fra.months / 12;
  const birthYear = currentScenario.birthDate.getFullYear();
  const fraYear = birthYear + Math.floor(fraAge);

  const benefitFeedback = getBenefitAmountFeedback(
    expectedBenefit,
    projectedMaxBenefit,
    fraYear
  );
  const today = new Date();
  const isFutureBirthDate = currentScenario.birthDate > today;

  // Calculate current age for chart X-axis
  const currentAge = Math.floor(
    (today.getTime() - currentScenario.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  const minValidAge = 18;
  const minBirthDate = new Date(
    today.getFullYear() - minValidAge,
    today.getMonth(),
    today.getDate()
  );
  const isTooYoung = currentScenario.birthDate > minBirthDate;
  const isValidScenario =
    benefitFeedback.level !== 'error' &&
    currentScenario.benefitAmount > 0 &&
    !isFutureBirthDate &&
    !isTooYoung;

  const handleSave = async () => {
    if (!isValidScenario) {
      return; // Don't save invalid scenarios
    }

    try {
      let scenarioToSave = { ...currentScenario, benefitAmount: expectedBenefit };

      // If spouse is enabled globally, ensure scenario has spouse data
      if (includeSpouseGlobally) {
        scenarioToSave = {
          ...scenarioToSave,
          includeSpouse: true,
          spouseBirthDate: scenarioToSave.spouseBirthDate || globalSpouseBirthDate,
          spouseBenefitAmount:
            scenarioToSave.spouseBenefitAmount || scenarioToSave.benefitAmount * 0.5,
          spouseClaimingAge: scenarioToSave.spouseClaimingAge || scenarioToSave.claimingAge,
        };
      }

      // If editing an existing scenario, update it; otherwise save as new
      if (editingScenarioId) {
        await update(editingScenarioId, scenarioToSave);
      } else {
        await save(scenarioToSave);
      }

      // Clear editing state but keep current scenario as-is
      setEditingScenarioId(null);
      setIsDirty(false);
      setOriginalScenarioValues(null);
    } catch (error) {
      console.error('Failed to save scenario:', error);
    }
  };

  const handleSaveAsNew = async () => {
    if (!isValidScenario) {
      return; // Don't save invalid scenarios
    }

    try {
      // Generate a default name based on claiming age and assumptions
      const generatedName = getSuggestedScenarioName(
        currentScenario.claimingAge,
        currentScenario.assumptionPreset
      );

      let scenarioToSave = {
        ...currentScenario,
        benefitAmount: expectedBenefit,
        name: generatedName,
        id: crypto.randomUUID(), // Create new ID
      };

      // If spouse is enabled globally, ensure scenario has spouse data
      if (includeSpouseGlobally) {
        scenarioToSave = {
          ...scenarioToSave,
          includeSpouse: true,
          spouseBirthDate: scenarioToSave.spouseBirthDate || globalSpouseBirthDate,
          spouseBenefitAmount:
            scenarioToSave.spouseBenefitAmount || scenarioToSave.benefitAmount * 0.5,
          spouseClaimingAge: scenarioToSave.spouseClaimingAge || scenarioToSave.claimingAge,
        };
      }

      await save(scenarioToSave);

      // Clear editing state but keep current scenario as-is
      setEditingScenarioId(null);
      setIsDirty(false);
      setOriginalScenarioValues(null);
    } catch (error) {
      console.error('Failed to save scenario:', error);
    }
  };

  const handleToggleScenarioSelection = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleRenameScenario = async (id: string, newName: string) => {
    try {
      await update(id, { name: newName });
    } catch (error) {
      console.error('Failed to rename scenario:', error);
    }
  };

  const handleResetScenario = () => {
    const newScenario = createDefaultScenario({ name: 'Current Scenario' });
    // Preserve the user's birth date - only reset scenario parameters
    newScenario.birthDate = currentScenario.birthDate;
    if (includeSpouseGlobally) {
      newScenario.includeSpouse = true;
      newScenario.spouseBirthDate = globalSpouseBirthDate;
      newScenario.spouseBenefitAmount = newScenario.benefitAmount * 0.5;
      newScenario.spouseClaimingAge = newScenario.claimingAge;
    }
    setCurrentScenario(newScenario);
    setEditingScenarioId(null);
    setIsDirty(false);
    setOriginalScenarioValues(null);
  };

  const handleClearAllScenarios = async () => {
    try {
      // Delete all scenarios
      for (const scenario of scenarios) {
        await deleteScenario(scenario.id);
      }
      // Clear selection
      setSelectedScenarios([]);
      // Close confirmation
      setShowClearConfirmation(false);
    } catch (error) {
      console.error('Failed to clear scenarios:', error);
    }
  };

  // Mark as dirty when any field changes
  const markDirty = (updatedScenario: Scenario) => {
    setCurrentScenario(updatedScenario);
    setIsDirty(true);
  };

  // Handle benefit percentage changes
  // When user changes the percentage slider, update desiredBenefitPercentage
  // The actual benefit amount will be recalculated as Projected Max × Percentage
  const handleBenefitPercentageChange = (percentage: number) => {
    setDesiredBenefitPercentage(percentage);
    // Update the scenario with the new benefit amount
    const newBenefitAmount = Math.round((projectedMaxBenefit * percentage) / 100);
    setCurrentScenario((prev) => ({ ...prev, benefitAmount: newBenefitAmount }));
    // Mark scenario as dirty since the benefit is changing
    setIsDirty(true);
  };

  // Handle direct benefit amount input changes
  // When user types in the benefit amount directly, calculate what percentage that represents
  const handleDirectBenefitAmountChange = (amount: number) => {
    if (projectedMaxBenefit > 0) {
      const calculatedPercent = (amount / projectedMaxBenefit) * 100;
      setDesiredBenefitPercentage(Math.round(calculatedPercent));
      // Update the scenario with the new benefit amount
      setCurrentScenario((prev) => ({ ...prev, benefitAmount: amount }));
      setIsDirty(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Social Security Calculator
              </h1>
              <p className="text-sm text-muted-foreground">
                Find the optimal age to start collecting benefits
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Birth Date</div>
                <div className="font-semibold">
                  {currentScenario.birthDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                ⚙️ Settings
              </Button>
              <div className="text-xs text-muted-foreground">
                💾 All data saved in your browser
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome message - full width, dismissable */}
        {showWelcome && (
          <Alert className="mb-6 !flex !flex-row items-center gap-4">
            <div className="text-sm flex-1">
              👋 <strong>Welcome!</strong> Configure your retirement scenario below,
              then save it to compare different claiming strategies. The chart shows
              cumulative benefits over your lifetime.
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcome(false)}
              className="h-6 w-6 p-0 shrink-0"
            >
              ✕
            </Button>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart & Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart - Now at the top */}
            <Card className="p-6">
              <CumulativeBenefitsChart
                data={chartData}
                displayMode={globalDisplayMode}
                onDisplayModeChange={setGlobalDisplayMode}
                chartType={chartType}
                onChartTypeChange={setChartType}
                currentAge={currentAge}
                breakevens={breakevens}
              />
            </Card>

            {/* Save Buttons */}
            <Card className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={!isValidScenario || !editingScenarioId}
                  variant={editingScenarioId ? 'default' : 'outline'}
                >
                  Save
                </Button>
                <Button
                  onClick={handleSaveAsNew}
                  size="sm"
                  disabled={!isValidScenario}
                  variant="default"
                >
                  Save as New
                </Button>
              </div>
              <Button
                onClick={handleResetScenario}
                size="sm"
                variant="outline"
                className="w-full"
              >
                ↻ Reset
              </Button>
              {!isValidScenario && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Cannot save: Please fix validation errors above
                </p>
              )}
            </Card>

            {/* Tabs for Individual/Spouse/Assumptions */}
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className={`grid w-full ${includeSpouseGlobally ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="individual">Individual</TabsTrigger>
                {includeSpouseGlobally && (
                  <TabsTrigger value="spouse">Spouse ✓</TabsTrigger>
                )}
                <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="space-y-0">
                <IndividualInputs
                  birthDate={currentScenario.birthDate}
                  benefitAmount={expectedBenefit}
                  desiredPercentage={desiredBenefitPercentage}
                  projectedMaxBenefit={projectedMaxBenefit}
                  claimingAge={currentScenario.claimingAge}
                  colaRate={currentScenario.colaRate}
                  onBirthDateChange={(date) =>
                    markDirty({ ...currentScenario, birthDate: date })
                  }
                  onBenefitAmountChange={handleDirectBenefitAmountChange}
                  onBenefitPercentageChange={handleBenefitPercentageChange}
                  onClaimingAgeChange={(age) =>
                    markDirty({ ...currentScenario, claimingAge: age })
                  }
                  onReset={handleResetScenario}
                />
              </TabsContent>

              <TabsContent value="spouse" className="space-y-4">
                {includeSpouseGlobally &&
                currentScenario.spouseBirthDate &&
                currentScenario.spouseBenefitAmount !== undefined &&
                currentScenario.spouseClaimingAge !== undefined ? (
                  <SpouseInputs
                    spouseBirthDate={currentScenario.spouseBirthDate}
                    spouseBenefitAmount={currentScenario.spouseBenefitAmount}
                    spouseClaimingAge={currentScenario.spouseClaimingAge}
                    partnerBenefitAmount={currentScenario.benefitAmount}
                    onBirthDateChange={(date) =>
                      markDirty({ ...currentScenario, spouseBirthDate: date })
                    }
                    onBenefitAmountChange={(amount) =>
                      markDirty({ ...currentScenario, spouseBenefitAmount: amount })
                    }
                    onClaimingAgeChange={(age) =>
                      markDirty({ ...currentScenario, spouseClaimingAge: age })
                    }
                  />
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      Spousal benefits not enabled
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enable spouse in Settings to configure spousal benefits.
                    </p>
                    <Button onClick={() => setShowSettings(true)}>
                      Open Settings
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="assumptions" className="space-y-0">
                <AssumptionsPanel
                  preset={currentScenario.assumptionPreset}
                  growthRate={currentScenario.investmentGrowthRate}
                  colaRate={currentScenario.colaRate}
                  inflationRate={currentScenario.inflationRate}
                  onPresetChange={(preset) => {
                    setCurrentScenario((prev) => ({
                      ...prev,
                      assumptionPreset: preset as AssumptionPreset | 'custom',
                    }));
                    setIsDirty(true);
                  }}
                  onGrowthRateChange={(rate) => {
                    setCurrentScenario((prev) => ({ ...prev, investmentGrowthRate: rate }));
                    setIsDirty(true);
                  }}
                  onColaRateChange={(rate) => {
                    setCurrentScenario((prev) => ({ ...prev, colaRate: rate }));
                    setIsDirty(true);
                  }}
                  onInflationRateChange={(rate) => {
                    setCurrentScenario((prev) => ({ ...prev, inflationRate: rate }));
                    setIsDirty(true);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Saved Scenarios */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Saved Scenarios</h2>
                {scenarios.length > 0 && (
                  !showClearConfirmation ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowClearConfirmation(true)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Clear All
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAllScenarios}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearConfirmation(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )
                )}
              </div>
              {scenarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No saved scenarios yet.<br />
                  Create and save your first scenario!
                </p>
              ) : (
                <div className="space-y-3">
                  {scenarios.map((scenario) => {
                    const scenarioResult = selectedResults.find(r => r.scenario.id === scenario.id);
                    return (
                      <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        isSelected={selectedScenarios.includes(scenario.id)}
                        isEditing={editingScenarioId === scenario.id}
                        cumulativeBenefits={scenarioResult?.cumulativeBenefits}
                        onSelect={() => handleToggleScenarioSelection(scenario.id)}
                        onEdit={() => {
                          setCurrentScenario(scenario);
                          setEditingScenarioId(scenario.id);
                          setIsDirty(false);
                          setOriginalScenarioValues(scenario);
                        }}
                        onDelete={() => deleteScenario(scenario.id)}
                        onRename={(newName) =>
                          handleRenameScenario(scenario.id, newName)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        birthDate={currentScenario.birthDate}
        includeSpouse={includeSpouseGlobally}
        spouseBirthDate={globalSpouseBirthDate}
        onIndividualBirthdateChange={(date) =>
          setCurrentScenario({ ...currentScenario, birthDate: date })
        }
        onIncludeSpouseChange={setIncludeSpouseGlobally}
        onSpouseBirthdateChange={setGlobalSpouseBirthDate}
      />
    </div>
  );
}
