/**
 * Assumptions Panel Component
 *
 * Allows users to select preset assumptions or customize their own.
 * Features visual preset cards with personality!
 */

'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AssumptionInput } from './AssumptionInput';
import { ASSUMPTION_PRESETS, type AssumptionPreset } from '@/constants/ssaRules';
import {
  getGrowthRateFeedback,
  getColaFeedback,
  getInflationFeedback,
} from '@/lib/validation/feedback';

interface AssumptionsPanelProps {
  preset: AssumptionPreset | 'custom';
  growthRate: number;
  colaRate: number;
  inflationRate: number;
  onPresetChange: (preset: AssumptionPreset | 'custom') => void;
  onGrowthRateChange: (rate: number) => void;
  onColaRateChange: (rate: number) => void;
  onInflationRateChange: (rate: number) => void;
}

export function AssumptionsPanel({
  preset,
  growthRate,
  colaRate,
  inflationRate,
  onPresetChange,
  onGrowthRateChange,
  onColaRateChange,
  onInflationRateChange,
}: AssumptionsPanelProps) {
  const presets: Array<{
    key: AssumptionPreset;
    name: string;
    description: string;
    emoji: string;
    color: string;
  }> = [
    {
      key: 'conservative',
      name: 'Conservative',
      description: 'Play it safe with lower growth and stable inflation',
      emoji: '🛡️',
      color: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
    },
    {
      key: 'moderate',
      name: 'Moderate',
      description: 'Balanced assumptions based on historical averages',
      emoji: '⚖️',
      color: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900',
    },
    {
      key: 'historical',
      name: 'Historical',
      description: 'Optimistic returns matching long-term stock market',
      emoji: '📈',
      color: 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900',
    },
  ];

  const handlePresetClick = (presetKey: AssumptionPreset) => {
    onPresetChange(presetKey);
    const presetValues = ASSUMPTION_PRESETS[presetKey];
    onGrowthRateChange(presetValues.investmentGrowthRate);
    onColaRateChange(presetValues.colaRate);
    onInflationRateChange(presetValues.inflationRate);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">
          Financial Assumptions
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Choose a preset or customize your own projections
        </p>

        {/* Preset Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePresetClick(p.key)}
              className={`
                relative p-4 rounded-lg border-2 transition-all text-left
                ${
                  preset === p.key
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }
              `}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-20 rounded-lg`} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="font-semibold">{p.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <div className="mt-3 text-xs space-y-1 font-mono">
                  <div>Growth: {ASSUMPTION_PRESETS[p.key].investmentGrowthRate}%</div>
                  <div>COLA: {ASSUMPTION_PRESETS[p.key].colaRate}%</div>
                  <div>Inflation: {ASSUMPTION_PRESETS[p.key].inflationRate}%</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Inputs */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold">Custom Values</Label>
          {preset === 'custom' && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Custom
            </span>
          )}
        </div>

        <AssumptionInput
          label="Investment Growth Rate"
          value={growthRate}
          onChange={(v) => {
            onGrowthRateChange(v);
            onPresetChange('custom');
          }}
          feedback={getGrowthRateFeedback(growthRate)}
          icon="💰"
          min={-5}
          max={20}
          helpText="Annual return if you invest benefits instead of spending them"
        />

        <AssumptionInput
          label="Expected COLA"
          value={colaRate}
          onChange={(v) => {
            onColaRateChange(v);
            onPresetChange('custom');
          }}
          feedback={getColaFeedback(colaRate)}
          icon="📊"
          min={0}
          max={15}
          helpText="Cost of Living Adjustment - how much benefits increase each year"
        />

        <AssumptionInput
          label="Inflation Rate"
          value={inflationRate}
          onChange={(v) => {
            onInflationRateChange(v);
            onPresetChange('custom');
          }}
          feedback={getInflationFeedback(inflationRate)}
          icon="💵"
          min={0}
          max={20}
          helpText="Expected inflation for converting to today's dollars"
        />
      </Card>
    </div>
  );
}
