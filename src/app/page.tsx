/**
 * Social Security Calculator - Main Page
 *
 * Help users answer: "At what age should I start collecting Social Security?"
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IndividualInputs } from '@/components/calculator/IndividualInputs';
import { SpouseInputs } from '@/components/calculator/SpouseInputs';
import { AssumptionsPanel } from '@/components/calculator/AssumptionsPanel';
import { CumulativeBenefitsChart } from '@/components/charts/CumulativeBenefitsChart';
import { ScenarioCard } from '@/components/scenarios/ScenarioCard';
import { createDefaultScenario } from '@/constants/defaults';
import { useScenarios } from '@/hooks/useScenarios';
import { useCalculations, useMultipleCalculations } from '@/hooks/useCalculations';
import { findBreakevenAge } from '@/lib/calculations/breakeven';
import { getBenefitAmountFeedback } from '@/lib/validation/feedback';
import { getMaxBenefit } from '@/constants/ssaRules';
import type { Scenario } from '@/types/scenario';
import type { AssumptionPreset } from '@/constants/ssaRules';

export default function Home() {
  // Current scenario being edited
  const [currentScenario, setCurrentScenario] = useState<Scenario>(
    createDefaultScenario({ name: 'New Scenario' })
  );

  // Saved scenarios
  const { scenarios, save, deleteScenario } = useScenarios();

  // Selected scenarios for comparison
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  // Calculate current scenario
  const currentResults = useCalculations(currentScenario);

  // Calculate selected scenarios
  const selectedScenarioObjects = scenarios.filter((s) =>
    selectedScenarios.includes(s.id)
  );
  const selectedResults = useMultipleCalculations(selectedScenarioObjects);

  // Calculate breakevens for selected scenarios
  const breakevens = selectedResults.length >= 2
    ? selectedResults
        .slice(0, -1)
        .map((r1, i) => {
          const r2 = selectedResults[i + 1];
          const age = findBreakevenAge(
            r1.cumulativeBenefits,
            r2.cumulativeBenefits
          );
          return age
            ? {
                age: Math.round(age),
                scenario1: r1.scenario.name,
                scenario2: r2.scenario.name,
              }
            : null;
        })
        .filter((b): b is { age: number; scenario1: string; scenario2: string } => b !== null)
    : [];

  // Chart data
  // Only include currentScenario if it's not already in the selected saved scenarios
  const currentScenarioIsSaved = scenarios.some((s) => s.id === currentScenario.id);
  const chartData = [
    ...(currentScenarioIsSaved
      ? []
      : [
          {
            name: currentScenario.name,
            benefits: currentResults.cumulativeBenefits,
            color: '#3b82f6',
            claimingAge: currentScenario.claimingAge,
          },
        ]),
    ...selectedResults.map((result, i) => ({
      name: result.scenario.name,
      benefits: result.cumulativeBenefits,
      color: ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][i] || '#06b6d4',
      claimingAge: result.scenario.claimingAge,
    })),
  ];

  // Validate current scenario
  const maxBenefit = getMaxBenefit();
  const benefitFeedback = getBenefitAmountFeedback(currentScenario.benefitAmount, maxBenefit);
  const today = new Date();
  const isFutureBirthDate = currentScenario.birthDate > today;
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

  const handleSaveScenario = async () => {
    if (!isValidScenario) {
      return; // Don't save invalid scenarios
    }

    try {
      await save(currentScenario);
      // Create a new scenario for the next one
      setCurrentScenario(createDefaultScenario({ name: 'New Scenario' }));
    } catch (error) {
      console.error('Failed to save scenario:', error);
    }
  };

  const handleToggleScenarioSelection = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
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
            <div className="text-xs text-muted-foreground">
              💾 All data saved in your browser
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Alert */}
            <Alert>
              <AlertDescription className="text-sm">
                👋 <strong>Welcome!</strong> Configure your retirement scenario below,
                then save it to compare different claiming strategies. The chart shows
                cumulative benefits over your lifetime.
              </AlertDescription>
            </Alert>

            {/* Tabs for Individual/Spouse/Assumptions */}
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="individual">Individual</TabsTrigger>
                <TabsTrigger value="spouse">
                  Spouse {currentScenario.includeSpouse && '✓'}
                </TabsTrigger>
                <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="space-y-4">
                <IndividualInputs
                  birthDate={currentScenario.birthDate}
                  benefitAmount={currentScenario.benefitAmount}
                  claimingAge={currentScenario.claimingAge}
                  onBirthDateChange={(date) =>
                    setCurrentScenario({ ...currentScenario, birthDate: date })
                  }
                  onBenefitAmountChange={(amount) =>
                    setCurrentScenario({ ...currentScenario, benefitAmount: amount })
                  }
                  onClaimingAgeChange={(age) =>
                    setCurrentScenario({ ...currentScenario, claimingAge: age })
                  }
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeSpouse"
                    checked={currentScenario.includeSpouse}
                    onChange={(e) => {
                      const include = e.target.checked;
                      setCurrentScenario({
                        ...currentScenario,
                        includeSpouse: include,
                        spouseBirthDate: include
                          ? currentScenario.spouseBirthDate || new Date(currentScenario.birthDate)
                          : undefined,
                        spouseBenefitAmount: include
                          ? currentScenario.spouseBenefitAmount || currentScenario.benefitAmount * 0.5
                          : undefined,
                        spouseClaimingAge: include
                          ? currentScenario.spouseClaimingAge || currentScenario.claimingAge
                          : undefined,
                      });
                    }}
                    className="rounded"
                  />
                  <label htmlFor="includeSpouse" className="text-sm font-medium cursor-pointer">
                    Include spouse in calculations
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="spouse" className="space-y-4">
                {currentScenario.includeSpouse &&
                currentScenario.spouseBirthDate &&
                currentScenario.spouseBenefitAmount !== undefined &&
                currentScenario.spouseClaimingAge !== undefined ? (
                  <SpouseInputs
                    spouseBirthDate={currentScenario.spouseBirthDate}
                    spouseBenefitAmount={currentScenario.spouseBenefitAmount}
                    spouseClaimingAge={currentScenario.spouseClaimingAge}
                    partnerBenefitAmount={currentScenario.benefitAmount}
                    onBirthDateChange={(date) =>
                      setCurrentScenario({ ...currentScenario, spouseBirthDate: date })
                    }
                    onBenefitAmountChange={(amount) =>
                      setCurrentScenario({ ...currentScenario, spouseBenefitAmount: amount })
                    }
                    onClaimingAgeChange={(age) =>
                      setCurrentScenario({ ...currentScenario, spouseClaimingAge: age })
                    }
                  />
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      Spousal benefits not enabled
                    </p>
                    <Button
                      onClick={() =>
                        setCurrentScenario({
                          ...currentScenario,
                          includeSpouse: true,
                          spouseBirthDate: new Date(currentScenario.birthDate),
                          spouseBenefitAmount: currentScenario.benefitAmount * 0.5,
                          spouseClaimingAge: currentScenario.claimingAge,
                        })
                      }
                    >
                      Enable Spousal Benefits
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="assumptions" className="space-y-4">
                <AssumptionsPanel
                  preset={currentScenario.assumptionPreset}
                  growthRate={currentScenario.investmentGrowthRate}
                  colaRate={currentScenario.colaRate}
                  inflationRate={currentScenario.inflationRate}
                  onPresetChange={(preset) =>
                    setCurrentScenario({
                      ...currentScenario,
                      assumptionPreset: preset as AssumptionPreset | 'custom',
                    })
                  }
                  onGrowthRateChange={(rate) =>
                    setCurrentScenario({ ...currentScenario, investmentGrowthRate: rate })
                  }
                  onColaRateChange={(rate) =>
                    setCurrentScenario({ ...currentScenario, colaRate: rate })
                  }
                  onInflationRateChange={(rate) =>
                    setCurrentScenario({ ...currentScenario, inflationRate: rate })
                  }
                />
              </TabsContent>
            </Tabs>

            {/* Save Scenario */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={currentScenario.name}
                  onChange={(e) =>
                    setCurrentScenario({ ...currentScenario, name: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder="Scenario name..."
                />
                <Button
                  onClick={handleSaveScenario}
                  size="lg"
                  disabled={!isValidScenario}
                >
                  💾 Save Scenario
                </Button>
              </div>
              {!isValidScenario && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Cannot save: Please fix validation errors above
                </p>
              )}
            </Card>

            {/* Chart */}
            <Card className="p-6">
              <CumulativeBenefitsChart
                data={chartData}
                displayMode={currentScenario.displayMode}
                breakevens={breakevens}
              />
            </Card>
          </div>

          {/* Right Column - Saved Scenarios */}
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Saved Scenarios</h2>
              {scenarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No saved scenarios yet.<br />
                  Create and save your first scenario!
                </p>
              ) : (
                <div className="space-y-3">
                  {scenarios.map((scenario) => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      isSelected={selectedScenarios.includes(scenario.id)}
                      onSelect={() => handleToggleScenarioSelection(scenario.id)}
                      onEdit={() => setCurrentScenario(scenario)}
                      onDelete={() => deleteScenario(scenario.id)}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
