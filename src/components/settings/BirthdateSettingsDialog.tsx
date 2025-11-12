/**
 * Birthdate Settings Dialog Component
 *
 * Allows users to set their birth month and year (privacy-focused).
 * Stores internally as a full date, but UI only shows month/year.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  birthDate: Date;
  includeSpouse: boolean;
  spouseBirthDate?: Date;
  onIndividualBirthdateChange: (date: Date) => void;
  onIncludeSpouseChange: (include: boolean) => void;
  onSpouseBirthdateChange?: (date: Date) => void;
}

const MONTHS = [
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

function getYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const years = [];
  for (let year = currentYear; year >= minYear; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
}

export function SettingsDialog({
  open,
  onOpenChange,
  birthDate,
  includeSpouse,
  spouseBirthDate,
  onIndividualBirthdateChange,
  onIncludeSpouseChange,
  onSpouseBirthdateChange,
}: SettingsDialogProps) {
  const [individualMonth, setIndividualMonth] = useState(
    birthDate.getMonth().toString()
  );
  const [individualYear, setIndividualYear] = useState(
    birthDate.getFullYear().toString()
  );

  const [localIncludeSpouse, setLocalIncludeSpouse] = useState(includeSpouse);

  const [spouseMonth, setSpouseMonth] = useState(
    spouseBirthDate?.getMonth().toString() || '0'
  );
  const [spouseYear, setSpouseYear] = useState(
    spouseBirthDate?.getFullYear().toString() || new Date().getFullYear().toString()
  );

  const yearOptions = getYearOptions();

  const handleSave = () => {
    // For individual birthdate (use 15th of month as default day)
    const newIndividualDate = new Date(
      parseInt(individualYear),
      parseInt(individualMonth),
      15
    );
    onIndividualBirthdateChange(newIndividualDate);

    // Update spouse inclusion setting
    onIncludeSpouseChange(localIncludeSpouse);

    // For spouse birthdate if needed
    if (localIncludeSpouse && onSpouseBirthdateChange) {
      const newSpouseDate = new Date(
        parseInt(spouseYear),
        parseInt(spouseMonth),
        15
      );
      onSpouseBirthdateChange(newSpouseDate);
    }

    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset to current values when opening
      setIndividualMonth(birthDate.getMonth().toString());
      setIndividualYear(birthDate.getFullYear().toString());
      setLocalIncludeSpouse(includeSpouse);
      if (spouseBirthDate) {
        setSpouseMonth(spouseBirthDate.getMonth().toString());
        setSpouseYear(spouseBirthDate.getFullYear().toString());
      }
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Birth Date Settings</DialogTitle>
          <DialogDescription>
            Set your birth month and year. Only month and year are displayed for privacy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Individual Birthdate */}
          <div className="space-y-3">
            <h3 className="font-semibold">Your Birth Date</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="individual-month">Month</Label>
                <Select value={individualMonth} onValueChange={setIndividualMonth}>
                  <SelectTrigger id="individual-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="individual-year">Year</Label>
                <Select value={individualYear} onValueChange={setIndividualYear}>
                  <SelectTrigger id="individual-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Spouse Toggle */}
            <div className="flex items-center gap-3 pt-2 border-t mt-4">
              <input
                id="includeSpouse"
                type="checkbox"
                checked={localIncludeSpouse}
                onChange={(e) => setLocalIncludeSpouse(e.target.checked)}
                className="rounded w-4 h-4"
              />
              <Label htmlFor="includeSpouse" className="cursor-pointer">
                Include spouse in calculations
              </Label>
            </div>
          </div>

          {/* Spouse Birthdate */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold">Spouse's Birth Date</h3>
            <p className="text-xs text-muted-foreground">
              {localIncludeSpouse
                ? 'Your spouse\'s birth date is included in scenarios.'
                : 'Enable the checkbox above to include spouse in calculations.'}
            </p>
            <div className="grid grid-cols-2 gap-4 opacity-50 disabled:opacity-50" style={{ pointerEvents: localIncludeSpouse ? 'auto' : 'none', opacity: localIncludeSpouse ? 1 : 0.5 }}>
              <div className="space-y-2">
                <Label htmlFor="spouse-month">Month</Label>
                <Select value={spouseMonth} onValueChange={setSpouseMonth} disabled={!localIncludeSpouse}>
                  <SelectTrigger id="spouse-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse-year">Year</Label>
                <Select value={spouseYear} onValueChange={setSpouseYear} disabled={!localIncludeSpouse}>
                  <SelectTrigger id="spouse-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Birth Dates</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
