# Product Requirements Document: Social Security Benefits Calculator

## Product Overview

### Vision
Create an intuitive, error-resistant Social Security calculator that helps users determine the optimal age to start collecting retirement benefits. The calculator will account for financial opportunity costs, inflation, COLA adjustments, and spousal benefits to provide comprehensive scenario analysis.

### Goals
- Help users answer: "At what age should I start collecting Social Security benefits?"
- Prevent common input errors through smart validation and UI constraints
- Enable comparison of multiple retirement scenarios
- Provide clear visualizations of breakeven points and cumulative benefits
- Support both individual and spousal benefit calculations

## Target Users

### Primary Persona: Pre-Retiree Planning
- Age: 55-70 years old
- Goal: Optimize Social Security claiming strategy
- Technical comfort: Moderate (can use web apps but not financial experts)
- Pain points: Existing calculators allow unrealistic inputs, unclear how investment opportunity costs affect decisions

### Secondary Persona: Couples Planning Together
- Age: 55-70 years old
- Goal: Coordinate spousal claiming strategies to maximize household benefits
- Need: Understand how spousal benefits interact with individual benefits

## Core Features

### 1. User Information Input

#### Individual Information
- **Birth date input**
  - Automatically calculates Full Retirement Age (FRA) based on birth year
  - Displays calculated FRA prominently

- **Expected monthly benefit at FRA**
  - Dual input modes:
    - Direct dollar amount entry (with validation)
    - Percentage of maximum benefit slider (0-100% of current year's max)
  - Display current year's maximum benefit for reference ($4,018 for 2025)
  - Validation: Prevent unrealistic values (e.g., no $293,000 from paste errors)

- **Claiming age selection**
  - Slider or dropdown constrained to ages 62-70 only
  - Visual indicators showing FRA position on slider
  - Display benefit adjustment percentage as user adjusts claiming age

#### Spousal Information (Optional)
- **Toggle to include spouse**
- **Spouse's birth date** → auto-calculate spouse's FRA
- **Spouse's expected benefit at their FRA**
  - Same dual input modes as primary user
- **Spouse's claiming age** (62-70)
  - Defaults to same year as primary user retires
- **Automatic calculation**: System determines whether spouse receives their own benefit OR 50% of primary's benefit (whichever is higher)

### 2. Financial Assumptions

#### Preset Profiles
Users can select from three preset assumption profiles:

1. **Conservative**
   - Investment growth rate: 2%
   - Expected COLA: 2.5%
   - Inflation rate: 2%

2. **Moderate** (Default)
   - Investment growth rate: 5%
   - Expected COLA: 2.5%
   - Inflation rate: 3%

3. **Historical**
   - Investment growth rate: 7%
   - Expected COLA: 2.6%
   - Inflation rate: 3%

#### Manual Override
- Users can manually adjust any assumption
- Each input displays a **qualitative feedback badge** with color-coded assessment:

**Investment Growth Rate:**
- < 0%: "Negative Returns" (red)
- 0-3%: "Conservative" (blue)
- 4-7%: "Moderate" (green)
- 8-10%: "Aggressive" (yellow)
- > 10%: "Unrealistic" (red)

**COLA (Cost of Living Adjustment):**
- < 1%: "Very Low" (blue)
- 1-2%: "Low" (blue)
- 2-3%: "Historical Average" (green)
- 3-5%: "Elevated" (yellow)
- > 5%: "Very High" (red)

**Inflation Rate:**
- < 1%: "Deflationary" (blue)
- 1-2%: "Low" (blue)
- 2-3.5%: "Target Range" (green)
- 3.5-5%: "Elevated" (yellow)
- 5-8%: "High" (orange)
- > 8%: "Extremely High" (red)

Each badge includes a tooltip explaining:
- What the range means
- Historical context
- Why this matters for calculations

### 3. Benefit Calculations

#### Social Security Benefit Rules

**Full Retirement Age (FRA) by Birth Year:**
- Born 1943-1954: FRA = 66
- Born 1955: FRA = 66 years, 2 months
- Born 1956: FRA = 66 years, 4 months
- Born 1957: FRA = 66 years, 6 months
- Born 1958: FRA = 66 years, 8 months
- Born 1959: FRA = 66 years, 10 months
- Born 1960 or later: FRA = 67

**Early Retirement Reduction (Ages 62 to FRA):**
- First 36 months before FRA: 5/9 of 1% per month (6.67% per year)
- Each additional month beyond 36: 5/12 of 1% per month (5% per year)
- Maximum reduction at age 62:
  - For FRA 66: 25% reduction
  - For FRA 67: 30% reduction

**Delayed Retirement Credits (FRA to Age 70):**
- 2/3 of 1% per month (8% per year)
- Maximum increase at age 70:
  - For FRA 66: 32% increase
  - For FRA 67: 24% increase
- No additional benefit for delaying past age 70

**Spousal Benefits:**
- Base spousal benefit: 50% of primary earner's Primary Insurance Amount (PIA)
- Spouse receives the HIGHER of:
  - Their own retirement benefit, OR
  - Spousal benefit (50% of partner's PIA)
- Early claiming reduces spousal benefit (same early retirement penalties apply)
- Spousal benefit is based on partner's PIA at FRA, not their actual claiming age

#### Financial Projections

**Year-by-Year Calculations (for each scenario):**
1. **Annual benefit amount**
   - Start with base benefit (adjusted for claiming age)
   - Apply COLA each year (compounding)
   - Calculate for both individual and spouse (if applicable)

2. **Inflation-adjusted values**
   - Display toggle: "Today's Dollars" vs "Future Dollars"
   - Apply inflation adjustment to show real purchasing power

3. **Investment opportunity cost**
   - For each year benefits are delayed, calculate what those forgone benefits could have earned if invested
   - Compound at specified growth rate
   - Show cumulative opportunity cost in visualizations

4. **Cumulative totals**
   - Sum of all benefits received to date (adjusted for inflation if selected)
   - Include or exclude investment opportunity costs based on toggle

### 4. Scenario Management

#### Creating Scenarios
- Users configure all inputs (individual, spouse, assumptions)
- Click "Save Scenario" to persist
- Prompt for scenario name (e.g., "Retire at 62", "Retire at 67", "Max at 70")
- Store in browser's IndexedDB

#### Scenario List
- Display all saved scenarios as cards or table rows
- Show key metrics for each:
  - Claiming age(s)
  - First year benefit amount
  - Lifetime total (to age 85, 90, 95 - user selectable)
- Actions: Edit, Duplicate, Delete

#### Scenario Comparison
- Select 2+ scenarios to compare
- View side-by-side or overlaid on charts
- Highlight breakeven points between scenarios
- Show pairwise comparisons (e.g., "Scenario A breaks even with Scenario B at age 78")

### 5. Visualizations

#### Primary View: Cumulative Benefits Chart
- Line chart showing cumulative benefits over time (age 62-100)
- One line per scenario
- X-axis: Age
- Y-axis: Total benefits received (in selected dollar format)
- Highlight breakeven points where lines intersect
- Toggle options:
  - Include/exclude investment opportunity costs
  - Today's dollars vs Future dollars
  - Individual only vs Household total (if spouse included)

#### Secondary View: Annual Benefits
- Bar chart or line chart showing annual benefit amounts
- Useful for seeing differences in yearly payment amounts
- Shows impact of COLA over time

#### Key Metrics Cards
For each scenario, display:
- **Total lifetime benefits** (to selected age: 85, 90, 95, 100)
- **First year benefit** (annual and monthly)
- **Breakeven ages** (compared to other scenarios)
- **Effective benefit rate** (accounting for opportunity costs)

### 6. Input Validation & Error Prevention

#### Age Constraints
- Claiming age slider: Hard limit 62-70 (cannot select outside range)
- Birth date: Prevent unrealistic dates (must be 62+ years old today)

#### Benefit Amount Validation
- If entering dollar amount:
  - Maximum: 125% of current year's maximum benefit
  - Warning if exceeds 100% of maximum: "This exceeds the maximum possible benefit"
  - Prevent paste of unrealistic values (parse and validate)
- If using percentage slider: Automatically constrained to 0-100%

#### Assumption Validation
- Show qualitative feedback badges for all assumptions
- Allow "unrealistic" values but warn user prominently
- Prevent negative COLA or inflation (must be >= 0%)

#### Spouse Logic Validation
- If spouse's own benefit > 50% of user's benefit, display: "Spouse will receive their own benefit"
- If spouse's own benefit < 50% of user's benefit, display: "Spouse will receive spousal benefit (50% of your benefit)"

## Data Persistence

### Storage Method
- Use browser's IndexedDB for all data storage
- Implement simple wrapper library (e.g., idb-keyval) to abstract IndexedDB complexity
- No server-side storage or user accounts

### Data Structure
```typescript
interface Scenario {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  // Individual
  birthDate: Date;
  benefitAmount: number;
  claimingAge: number;

  // Spouse (optional)
  includeSpouse: boolean;
  spouseBirthDate?: Date;
  spouseBenefitAmount?: number;
  spouseClaimingAge?: number;

  // Assumptions
  assumptionPreset: 'conservative' | 'moderate' | 'historical' | 'custom';
  investmentGrowthRate: number;
  colaRate: number;
  inflationRate: number;

  // Display preferences
  displayMode: 'today-dollars' | 'future-dollars';
  includeOpportunityCost: boolean;
  lifetimeAge: 85 | 90 | 95 | 100;
}
```

## Technical Requirements

### Performance
- All calculations must run client-side
- Scenario calculations should complete in < 100ms
- Chart rendering should be smooth (60fps) for up to 10 scenarios

### Browser Support
- Modern browsers (last 2 versions of Chrome, Firefox, Safari, Edge)
- No IE11 support required

### Deployment
- Static site generation (Next.js static export)
- Fully servable from CDN (no server-side rendering needed)
- All assets bundled at build time

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactions
- Screen reader support for all inputs and charts
- Sufficient color contrast for all text and badges

## Out of Scope (Future Considerations)

### Phase 1 Exclusions
- Survivor benefits
- Divorced spouse benefits
- Government Pension Offset (GPO) / Windfall Elimination Provision (WEP)
- Tax implications of Social Security benefits
- Medicare Part B premium deductions
- File and suspend strategies (no longer available)
- Restricted application strategies

### Potential Future Features
- Export scenarios to PDF/CSV
- Share scenarios via URL
- Integration with actual SSA benefit statements (via file upload)
- Monte Carlo simulations with variable growth rates
- Life expectancy calculator integration

## Success Metrics

### User Experience
- Users can create first scenario in < 2 minutes
- Users can compare 2 scenarios and identify breakeven point in < 30 seconds
- Zero instances of invalid input states (all prevented by UI)

### Accuracy
- Benefit calculations match SSA's official calculators within $1/month
- COLA and inflation adjustments compound correctly over 30+ year periods

## Open Questions & Assumptions

### Assumptions
- Users know (or can estimate) their expected benefit at FRA
- Users are comfortable with financial projection concepts
- Users want to see lifetime totals, not just monthly amounts
- Default life expectancy assumptions (charts show to age 100)

### Questions for User Research
- How important is mobile vs desktop usage?
- Do users prefer cumulative or annual benefit views?
- Should we show tax implications (even as rough estimates)?
- Is there value in showing confidence intervals for assumptions?

## Updates & Revision History

**Version 1.0** - Initial PRD (2025-11-06)
- Core feature set defined
- Spousal benefits included
- Qualitative feedback badges for assumptions
- Scenario comparison with breakeven analysis

---

**Note**: This PRD is a living document and should be updated as requirements evolve during development. See CLAUDE.md for development guidelines.
