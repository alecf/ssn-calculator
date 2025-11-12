# Bug Report - Social Security Calculator
**Test Date:** 2025-11-06
**Testing Tool:** Playwright via MCP
**Tester:** Claude Code

## Summary
Tested 5 key user workflows and identified 7 bugs ranging from calculation errors to validation issues.

---

## Bugs Found

### 🔴 HIGH PRIORITY

#### Bug #1: Incorrect Reduction Percentage Display on Slider
**Severity:** High
**Component:** Claiming Age Slider (ClaimingAgeInput component)
**Location:** components/calculator/ClaimingAgeInput.tsx (likely)

**Description:**
When setting the claiming age slider to 62 (for someone born in 1960 with FRA of 67), the slider displays "63% reduced" instead of the correct "30% reduced". However, the saved scenario correctly shows "-30.0% vs FRA".

**Steps to Reproduce:**
1. Set birth date to 1960-05-15
2. Set claiming age slider to 62
3. Observe the text below the slider

**Expected:** Should show "30% reduced" (or similar accurate percentage)
**Actual:** Shows "63% reduced"

**Notes:** The saved scenario card shows the correct "-30.0% vs FRA", indicating the calculation is correct but the slider display logic is wrong.

---

#### Bug #2: Incorrect Bonus Percentage for Age 70
**Severity:** High
**Component:** Claiming Age Slider (ClaimingAgeInput component)
**Location:** components/calculator/ClaimingAgeInput.tsx (likely)

**Description:**
When setting the claiming age slider to 70 (for someone with FRA of 67), the slider displays "+100% bonus" instead of the correct "+24% bonus" (8% per year for 3 years = 24%).

**Steps to Reproduce:**
1. Set birth date to any date giving FRA of 67
2. Move claiming age slider to 70
3. Observe the text below the slider

**Expected:** Should show "+24% bonus" or "+24.0% increase"
**Actual:** Shows "+100% bonus"

**Notes:** The saved scenario correctly shows "+24.0% vs FRA", so this is only a display issue on the slider itself.

---

#### Bug #3: Edited Scenarios Create Duplicates in Chart
**Severity:** High
**Component:** Scenario Management / Chart Display
**Location:** app/page.tsx or components/chart/CumulativeBenefitsChart.tsx

**Description:**
When editing an existing scenario and saving it, the chart doesn't update the existing line but instead adds a new duplicate entry with the same name but different parameters.

**Steps to Reproduce:**
1. Create and save a scenario "Early Claiming at 62" with claiming age 62
2. Click "Edit" on the saved scenario
3. Change claiming age to 65
4. Click "Save Scenario"
5. Observe the chart and legend

**Expected:** The existing scenario should be updated, showing only one "Early Claiming at 62" line with the new claiming age
**Actual:** Two "Early Claiming at 62" entries appear in the legend and chart - one at age 62 and one at age 65

**Impact:** This confuses users and clutters the chart with duplicate scenarios.

---

### 🟡 MEDIUM PRIORITY

#### Bug #4: React Key Uniqueness Warning
**Severity:** Medium
**Component:** Chart or Scenario List Rendering
**Location:** Console errors

**Description:**
Console shows React errors: "Encountered two children with the same key, %s. Keys should be unique so that components maintain their identity across updates."

**When It Occurs:**
- When editing scenarios
- When updating the chart with multiple scenarios

**Expected:** No React key warnings
**Actual:** Multiple key collision warnings in console

**Impact:** This could cause rendering issues and unpredictable behavior when scenarios are updated.

---

#### Bug #5: No Validation for Unrealistic Benefit Amounts
**Severity:** Medium
**Component:** Benefit Amount Input Validation
**Location:** components/calculator/BenefitAmountInput.tsx (likely)

**Description:**
While the app displays "Invalid Amount" label when entering $99,999/month, it doesn't prevent the user from saving or using this invalid data. The chart renders with the unrealistic value and the Save button remains enabled.

**Steps to Reproduce:**
1. Enter $99,999 in the benefit amount field
2. Observe that "Invalid Amount" label appears
3. Note that Save Scenario button is still clickable
4. Chart renders with impossible benefit amounts (scale goes to $24M)

**Expected:**
- Save button should be disabled for invalid amounts
- Clear error message explaining the valid range
- Chart should not render with invalid data

**Actual:** Only a subtle "Invalid Amount" label appears, and all functionality remains enabled

**Notes:** Per SSA guidelines, maximum benefit at FRA in 2024 is around $3,822/month, so validation should enforce reasonable limits (perhaps $100 - $5,000).

---

#### Bug #6: No Validation for Future Birth Dates
**Severity:** Medium
**Component:** Birth Date Input Validation
**Location:** components/calculator/BirthDateInput.tsx (likely)

**Description:**
The birth date field accepts future dates (e.g., 2030-01-01) with no validation error or warning. The app continues calculating as if this were valid.

**Steps to Reproduce:**
1. Click on birth date field
2. Enter "2030-01-01"
3. Observe no validation error appears
4. App continues to function normally

**Expected:**
- Error message: "Birth date cannot be in the future"
- Prevent saving scenarios with future birth dates
- Disable calculations until valid date is entered

**Actual:** Future dates are accepted without any warning

**Impact:** Users could accidentally enter wrong dates and get incorrect calculations.

---

### 🟢 LOW PRIORITY

#### Bug #7: Percentage Display Inconsistency
**Severity:** Low
**Component:** Claiming Age Slider Labels
**Location:** components/calculator/ClaimingAgeInput.tsx (likely)

**Description:**
The slider sometimes shows percentages as "63% reduced" or "+100% bonus" (which are incorrect - see bugs #1 and #2), while the saved scenario cards correctly show "-30.0% vs FRA" and "+24.0% vs FRA". The inconsistent formatting and terminology could confuse users.

**Recommendation:** Standardize on one format across the entire app, such as:
- "-30.0% vs FRA" for reductions
- "+24.0% vs FRA" for increases

This would be clearer than using "reduced" and "bonus" terminology.

---

## Test Coverage Summary

### ✅ Working Correctly
1. **Scenario Creation** - Users can create and save scenarios successfully
2. **Scenario Comparison** - Multiple scenarios display on chart for comparison
3. **Chart Visualization** - Cumulative benefits chart renders correctly with clear lines and legend
4. **Scenario Selection** - Clicking scenarios toggles them on/off in the chart
5. **Negative Number Prevention** - Spinbutton correctly rejects negative values
6. **Form Reset** - After saving, form resets to default values
7. **Responsive Feedback** - Warnings appear for early/late claiming decisions
8. **Data Persistence** - Scenarios are saved (appears to use IndexedDB as expected)

### ❌ Issues Found
1. Incorrect percentage calculations on slider (Bugs #1, #2)
2. Scenario editing creates duplicates (Bug #3)
3. React key warnings (Bug #4)
4. Insufficient input validation (Bugs #5, #6)
5. Inconsistent percentage display formatting (Bug #7)

---

## Recommendations

### Immediate Fixes Required:
1. **Fix calculation display** on the claiming age slider (Bugs #1 and #2)
2. **Fix scenario editing** to update existing scenarios instead of creating duplicates (Bug #3)
3. **Add input validation** for benefit amounts and birth dates (Bugs #5 and #6)

### Code Quality Improvements:
1. Fix React key uniqueness issues (Bug #4)
2. Standardize percentage display formatting across the app (Bug #7)
3. Add unit tests for benefit calculation logic
4. Add E2E tests for scenario editing workflow

---

## Test Screenshots
- `test-01-initial-load.png` - Initial app state
- `test-02-scenario-configured.png` - Scenario configured with age 62 (shows bug #1)
- `test-03-scenario-saved.png` - First scenario saved successfully
- `test-04-two-scenarios.png` - Two scenarios comparison
- `test-05-three-scenarios-comparison.png` - Full chart with three scenarios
- `test-06-edited-scenario.png` - After editing scenario (shows bug #3)
- `test-07-validation-testing.png` - Validation testing (shows bugs #5, #6)
- `test-08-chart-view.png` - Full chart view with all scenarios

---

## Overall Assessment

**Strengths:**
- Core functionality works well
- Chart visualization is clear and helpful
- User interface is intuitive
- Scenario comparison feature works as designed

**Critical Issues:**
- Calculation display errors could seriously mislead users about benefit amounts
- Scenario editing bug affects usability
- Input validation needs strengthening

**Recommendation:** Address high-priority bugs before production release. The calculation display errors (#1, #2) are particularly concerning as they could lead users to make poor retirement decisions based on incorrect information.
