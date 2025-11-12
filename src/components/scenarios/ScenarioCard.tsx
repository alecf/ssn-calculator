/**
 * Scenario Card Component
 *
 * Displays a saved scenario with key metrics and actions.
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Scenario } from '@/types/scenario';
import { calculateBenefit } from '@/lib/calculations/ssaBenefits';
import { getTotalLifetimeBenefit } from '@/lib/calculations/financialProjections';
import type { CumulativeBenefit } from '@/types/scenario';

interface ScenarioCardProps {
  scenario: Scenario;
  cumulativeBenefits?: CumulativeBenefit[];
  isSelected?: boolean;
  isEditing?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
}

export function ScenarioCard({
  scenario,
  cumulativeBenefits,
  isSelected = false,
  isEditing = false,
  onSelect,
  onEdit,
  onDelete,
  onRename,
}: ScenarioCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(scenario.name);

  // Calculate first year benefit
  const benefitCalc = calculateBenefit(
    scenario.benefitAmount,
    scenario.birthDate,
    scenario.claimingAge
  );

  const lifetimeTotal = cumulativeBenefits
    ? getTotalLifetimeBenefit(cumulativeBenefits, scenario.lifetimeAge)
    : 0;

  const getClaimingDescription = () => {
    const fraAge = benefitCalc.fra.years + benefitCalc.fra.months / 12;
    if (scenario.claimingAge < fraAge) {
      return 'Early claiming';
    } else if (scenario.claimingAge > fraAge) {
      return 'Delayed claiming';
    }
    return 'At full retirement age';
  };

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== scenario.name) {
      onRename?.(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditedName(scenario.name);
    }
  };

  return (
    <Card
      className={`p-4 transition-all cursor-pointer ${
        isEditing
          ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg'
          : isSelected
            ? 'ring-2 ring-primary shadow-lg'
            : 'hover:shadow-md hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {isEditingName ? (
              <Input
                autoFocus
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-lg h-8 mb-2"
                placeholder="Scenario name..."
              />
            ) : (
              <h3
                className="font-semibold text-lg cursor-text hover:text-primary hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                  setEditedName(scenario.name);
                }}
              >
                {scenario.name}
              </h3>
            )}
            <p className="text-sm text-muted-foreground">
              {getClaimingDescription()}
            </p>
          </div>
          {isSelected && (
            <Badge variant="default" className="shrink-0">
              Selected
            </Badge>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div>
            <div className="text-xs text-muted-foreground">Claiming Age</div>
            <div className="text-2xl font-bold">{scenario.claimingAge}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">First Year</div>
            <div className="text-lg font-semibold">
              ${Math.round(benefitCalc.monthlyBenefit).toLocaleString()}
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
          </div>
        </div>

        {/* Lifetime Total */}
        {lifetimeTotal > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">
              Total by age {scenario.lifetimeAge}
            </div>
            <div className="text-xl font-bold text-primary">
              ${Math.round(lifetimeTotal).toLocaleString()}
            </div>
          </div>
        )}

        {/* Adjustment Badge */}
        {benefitCalc.adjustmentPercentage !== 0 && (
          <div>
            <Badge
              variant={benefitCalc.adjustmentPercentage < 0 ? 'destructive' : 'default'}
              className="text-xs"
            >
              {benefitCalc.adjustmentPercentage > 0 ? '+' : ''}
              {benefitCalc.adjustmentPercentage.toFixed(1)}% vs FRA
            </Badge>
          </div>
        )}

        {/* Spouse indicator */}
        {scenario.includeSpouse && (
          <div className="text-xs text-muted-foreground">
            💑 Includes spousal benefits
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
