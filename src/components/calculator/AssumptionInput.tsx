/**
 * Assumption Input Component
 *
 * Input field with integrated qualitative feedback badge.
 * Shows contextual help to guide users toward realistic assumptions.
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { FeedbackResult } from '@/lib/validation/feedback';
import { getFeedbackVariant } from '@/lib/validation/feedback';

interface AssumptionInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  feedback: FeedbackResult;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  icon?: React.ReactNode;
}

export function AssumptionInput({
  label,
  value,
  onChange,
  feedback,
  unit = '%',
  min,
  max,
  step = 0.1,
  helpText,
  icon,
}: AssumptionInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <Label className="text-sm font-medium">{label}</Label>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={getFeedbackVariant(feedback.level)}
                className="cursor-help text-xs font-medium"
              >
                {feedback.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">{feedback.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="pr-8"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>

      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
