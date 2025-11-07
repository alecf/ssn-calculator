# Claude Development Guidelines

This document provides guidelines for AI-assisted development of the Social Security Benefits Calculator.

## Project Documentation

This project maintains three key documentation files:

1. **PRD.md** - Product Requirements Document
   - Defines WHAT we're building and WHY
   - User requirements and features
   - Success criteria
   - **Keep updated as requirements evolve**

2. **TECHNICAL_PLAN.md** - Technical Architecture & Design
   - Defines HOW we're building it
   - Technology choices and architecture
   - Component structure and data flow
   - **Keep updated as technical decisions are made**

3. **CLAUDE.md** (this file) - Development Guidelines
   - Guidelines for AI-assisted development
   - Coding standards and conventions
   - Update process for documentation

## Documentation Update Policy

### When to Update PRD.md

Update the PRD when:
- ✅ User requirements change
- ✅ New features are requested
- ✅ Features are deprioritized or cut
- ✅ Success criteria or metrics change
- ✅ User feedback reveals new needs
- ✅ Edge cases or validation rules are discovered

Add updates to the **"Updates & Revision History"** section with:
- Version number
- Date
- List of changes

### When to Update TECHNICAL_PLAN.md

Update the Technical Plan when:
- ✅ Architecture decisions are made
- ✅ Technology choices change
- ✅ New modules or components are added
- ✅ Data structures evolve
- ✅ Performance optimizations are implemented
- ✅ Security considerations are identified
- ✅ Build or deployment processes change

Add updates to the **"Updates & Revision History"** section with:
- Version number
- Date
- List of changes

### Documentation Update Process

1. **During Development**: Note any deviations from the plan
2. **After Major Changes**: Update relevant documentation immediately
3. **Version Increment**: Bump version (1.0 → 1.1 for minor, 1.0 → 2.0 for major)
4. **Revision History**: Log what changed and why

## Coding Standards

### TypeScript Guidelines

1. **Type Everything**
   - No `any` types (use `unknown` if truly unknown)
   - Define interfaces for all data structures
   - Use type guards for runtime validation

2. **Use Strict Mode**
   - Ensure `strict: true` in tsconfig.json
   - Enable all strict checks

3. **Naming Conventions**
   - Interfaces: PascalCase (e.g., `Scenario`, `YearlyBenefit`)
   - Functions: camelCase (e.g., `calculateFRA`, `projectBenefits`)
   - Components: PascalCase (e.g., `ScenarioCard`, `CumulativeBenefitsChart`)
   - Constants: UPPER_SNAKE_CASE (e.g., `MAX_BENEFIT`, `FRA_TABLE`)
   - Files: Match primary export (e.g., `ScenarioCard.tsx`, `ssaBenefits.ts`)

### React Component Guidelines

1. **Functional Components Only**
   - Use hooks for state and effects
   - No class components

2. **Component Structure**
   ```typescript
   // 1. Imports
   import { useState } from 'react';
   import { Button } from '@/components/ui/button';

   // 2. Types/Interfaces
   interface MyComponentProps {
     value: number;
     onChange: (value: number) => void;
   }

   // 3. Component
   export function MyComponent({ value, onChange }: MyComponentProps) {
     // 3a. Hooks
     const [localState, setLocalState] = useState(0);

     // 3b. Derived values
     const displayValue = value * 2;

     // 3c. Event handlers
     const handleChange = (newValue: number) => {
       onChange(newValue);
     };

     // 3d. Effects (if needed)
     // useEffect(...)

     // 3e. Render
     return (
       <div>
         {/* JSX */}
       </div>
     );
   }
   ```

3. **Props Guidelines**
   - Always define prop types
   - Prefer individual props over prop spreading
   - Use descriptive prop names

4. **State Management**
   - Keep state as local as possible
   - Lift state only when necessary
   - Use context for truly global state

### File Organization

1. **Group by Feature**
   - Components related to scenarios go in `components/scenarios/`
   - Business logic for SS benefits goes in `lib/calculations/`

2. **Index Files**
   - Use `index.ts` to re-export from directories
   - Makes imports cleaner: `import { ScenarioCard } from '@/components/scenarios'`

3. **Keep Files Focused**
   - One component per file
   - Group related utilities in single file
   - Split large files at ~200 lines

### Calculation Code Standards

1. **Pure Functions**
   - All calculation functions should be pure (no side effects)
   - Same inputs → same outputs
   - Makes testing easier

2. **Clear Function Signatures**
   ```typescript
   // Good: Clear parameters and return type
   function calculateBenefit(
     baseAmount: number,
     birthDate: Date,
     claimingAge: number
   ): number

   // Bad: Unclear what's returned
   function calculate(data: any): any
   ```

3. **Document Complex Logic**
   - Add comments for non-obvious calculations
   - Reference SSA rules or formulas
   - Example:
     ```typescript
     // Per SSA rules: 5/9 of 1% reduction per month for first 36 months
     // before FRA, then 5/12 of 1% for each additional month
     const reductionRate = monthsBeforeFRA <= 36
       ? EARLY_REDUCTION_RATE_36
       : EARLY_REDUCTION_RATE_BEYOND;
     ```

4. **Unit Test All Calculations**
   - Test with known SSA examples
   - Test edge cases (age 62, 70, exactly at FRA)
   - Test boundary conditions

### Validation & Error Handling

1. **Validate at Boundaries**
   - Validate user input in components
   - Validate data when reading from storage
   - Use Zod schemas for runtime validation

2. **Provide Helpful Error Messages**
   ```typescript
   // Good
   throw new Error('Claiming age must be between 62 and 70, got ${age}');

   // Bad
   throw new Error('Invalid input');
   ```

3. **Fail Gracefully**
   - Show user-friendly error messages
   - Provide fallback UI if calculations fail
   - Log errors for debugging

## Git Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc. (no code change)
- `refactor`: Refactoring production code
- `test`: Adding tests
- `chore`: Updating build tasks, package manager configs, etc.

### Message Length Guidelines

**Scale commit message length to match commit size:**

- **Small, targeted fixes** (1-3 files, <50 lines changed)
  - Keep message concise: 1-2 sentences in body
  - Focus on what changed and why
  - Example: One-line bug fix, typo correction, small refactor

- **Medium changes** (3-5 files, 50-200 lines changed)
  - Moderate detail: 1-2 short paragraphs
  - Explain problem and solution briefly
  - Example: Feature enhancement, validation addition

- **Large features** (5+ files, 200+ lines changed)
  - Comprehensive detail: Up to 4 paragraphs or lists
  - Include context, implementation details, impact
  - Example: New major feature, architectural change

**Key principle**: Don't write a novel for a one-line fix, but do provide adequate context for complex changes.

### Examples

**Small fix (concise):**
```
fix(calculator): correct FRA calculation for 1943 births

Changed comparison from <= to < for edge case.
```

**Medium change (moderate detail):**
```
fix(validation): prevent paste errors in benefit amount input

Add input sanitization to prevent users from accidentally pasting
large values like $293000 instead of $2930. Parser now strips
non-numeric characters and validates range.

Fixes: #12
```

**Large feature (comprehensive):**
```
feat(calculator): add spousal benefit calculations

Implement logic to determine whether spouse receives own benefit
or 50% of partner's benefit, whichever is higher.

Changes:
- Add SpouseInputs component with form fields
- Implement calculateSpousalBenefit() function with SSA rules
- Update chart to show combined household benefits
- Add spousal benefit tab to main calculator

The calculation handles early claiming reductions for spousal
benefits separately from personal benefits, following official
SSA guidelines.

Refs: PRD.md section 3.3
```

## Development Workflow

### Feature Development Process

1. **Plan the Feature**
   - Check PRD and Technical Plan
   - Identify affected components/modules
   - Note any documentation updates needed

2. **Implement**
   - Write TypeScript interfaces first
   - Implement business logic with tests
   - Build UI components
   - Add validation and error handling

3. **Test**
   - Unit test calculations
   - Manual test UI flows
   - Test edge cases

4. **Document**
   - Update inline code comments
   - Update PRD if requirements changed
   - Update Technical Plan if architecture changed
   - Write commit message

5. **Commit**
   - Stage related changes together
   - Write clear commit message
   - Reference PRD/Technical Plan if relevant

### Code Review Checklist (for AI)

Before considering code complete, check:

- [ ] TypeScript types are properly defined
- [ ] All functions have clear signatures
- [ ] Validation is in place for user inputs
- [ ] Error handling is implemented
- [ ] Components follow established patterns
- [ ] Calculations are tested (or tests are planned)
- [ ] Code is formatted consistently
- [ ] No console.logs or debug code left in
- [ ] PRD updated if requirements changed
- [ ] Technical Plan updated if architecture changed

## Testing Guidelines

### What to Test

1. **Calculation Functions** (High Priority)
   - All SSA benefit calculations
   - Financial projections
   - Breakeven analysis
   - Use known values from SSA documentation

2. **Validation Logic** (Medium Priority)
   - Input validation functions
   - Qualitative feedback logic
   - Edge case handling

3. **React Components** (Lower Priority)
   - Test complex logic in components
   - Integration tests for key workflows
   - Consider E2E tests for critical paths

### Test File Naming

- Place tests next to source: `ssaBenefits.ts` → `ssaBenefits.test.ts`
- Or in parallel structure: `lib/calculations/__tests__/ssaBenefits.test.ts`

### Test Structure

```typescript
describe('calculateBenefit', () => {
  it('should return FRA amount when claiming at FRA', () => {
    const result = calculateBenefit(
      3000,
      new Date('1960-01-01'),
      67
    );
    expect(result).toBe(3000);
  });

  it('should reduce benefit by 30% when claiming at 62 with FRA of 67', () => {
    const result = calculateBenefit(
      3000,
      new Date('1960-01-01'),
      62
    );
    expect(result).toBeCloseTo(2100, 0); // 30% reduction
  });

  // More tests...
});
```

## Common Patterns

### Date Handling

```typescript
// Parse birth date from form input
const birthDate = new Date(formInput);

// Calculate age
function getAge(birthDate: Date, asOfDate: Date = new Date()): number {
  const age = asOfDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = asOfDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOfDate.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  return age;
}

// Format for display
const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long'
});
const displayDate = formatter.format(birthDate);
```

### Currency Formatting

```typescript
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const displayAmount = currencyFormatter.format(monthlyBenefit);
// "$3,000"
```

### Percentage Formatting

```typescript
const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const displayPercent = percentFormatter.format(0.05);
// "5.0%"
```

### Memoization Pattern

```typescript
import { useMemo } from 'react';

function useCalculatedBenefits(scenario: Scenario) {
  return useMemo(() => {
    // Expensive calculation
    return calculateBenefitProjections(scenario);
  }, [scenario]); // Recalculate only when scenario changes
}
```

## Performance Guidelines

### Optimization Priorities

1. **Correctness First**
   - Get calculations right before optimizing
   - Add tests before refactoring

2. **Measure Before Optimizing**
   - Use React DevTools Profiler
   - Use browser Performance tab
   - Optimize only what's slow

3. **Common Optimizations**
   - Memoize expensive calculations
   - Use `React.memo` for pure components
   - Debounce rapid input changes
   - Virtualize long lists (if >50 items)

### When to Optimize

- User-perceivable lag (>100ms)
- Chart rendering is janky (<60fps)
- App startup is slow (>2s)
- Bundle size is large (>500KB gzipped)

## Accessibility Checklist

- [ ] All form inputs have associated labels
- [ ] Buttons have descriptive text (not just icons)
- [ ] Color is not the only means of conveying information
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works for all interactions
- [ ] ARIA labels for charts and complex UI
- [ ] Error messages are programmatically associated with inputs
- [ ] Page has proper heading hierarchy (h1 → h2 → h3)

## Security Checklist

- [ ] No eval() or Function() constructor
- [ ] No dangerouslySetInnerHTML (unless sanitized)
- [ ] User input is validated and sanitized
- [ ] Dependencies are kept up to date
- [ ] No sensitive data in local storage (only IndexedDB)
- [ ] No external API calls (unless explicitly planned)

## Questions & Decisions Log

Keep track of important decisions made during development:

### Decision Log Format

```markdown
## [Date] - [Topic]
**Question**: [The question or problem]
**Options Considered**:
1. Option A - pros/cons
2. Option B - pros/cons
**Decision**: Option A
**Rationale**: [Why this was chosen]
**Impact**: [PRD/Technical Plan updated]
```

### Example

```markdown
## 2025-11-06 - Chart Library Selection
**Question**: Which charting library should we use?
**Options Considered**:
1. Recharts - React-friendly, good defaults, limited customization
2. D3.js - Highly customizable, steep learning curve, more code
3. Chart.js - Popular, not React-specific, moderate customization
**Decision**: Recharts
**Rationale**: Best balance of React integration and good defaults.
Customization limitations are acceptable for our use case.
**Impact**: Updated TECHNICAL_PLAN.md section 2
```

---

## Current Development Status

**Last Updated**: 2025-11-06

### Completed
- ✅ Project initialization (Next.js, TypeScript, Tailwind)
- ✅ PRD created
- ✅ Technical Plan created
- ✅ Development guidelines (this file)

### In Progress
- 🔄 Setting up shadcn/ui
- 🔄 Implementing calculation engines

### Next Steps
1. Install and configure shadcn/ui
2. Implement core SSA benefit calculation logic
3. Build basic form components
4. Create data visualization components
5. Implement IndexedDB storage layer

---

**Remember**: This is a living document. Update it as the project evolves!
