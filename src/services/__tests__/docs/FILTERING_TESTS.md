# AI Dashboard Filtering Tests Documentation

## Overview

This document outlines the test strategy for verifying the filtering functionality in the AI Dashboard system. The tests cover both the UI component filtering and the data filtering that occurs before sending context to the AI Language Models (LLMs).

## Test Structure

The filtering tests are split into two main categories:

1. UI Component Tests (`src/components/dashboard/__tests__/AIDashboard.test.tsx`)
2. AI Service Tests (`src/services/__tests__/ai-filtering.test.ts`)

### Mock Data Structure

```typescript
const mockEmployees = [
  {
    id: 1,
    name: 'John Doe',
    position: 'Director',
    department: 'BOD',
    division: 'Executive',
    salary: 200000,
    specialty: 'Management'
  },
  // ... more employees
];
```

## UI Component Tests

### Test Cases

1. **No Filters Applied**
   - Purpose: Verify default behavior without any filters
   - Expectations:
     - All employees should be visible in the table
     - All departments should be represented in charts
   - Test: `should show all data when no filters are applied`

2. **Department Filter**
   - Purpose: Verify single department filtering
   - Expectations:
     - Only BOD employees should be visible
     - Back Office employees should be hidden
   - Test: `should filter data by department (BOD)`

3. **Multiple Criteria Filter**
   - Purpose: Verify complex filtering with multiple conditions
   - Filters:
     - Department: BOD
     - Division: Executive
     - Position: Director
   - Test: `should filter data by multiple criteria`

4. **Salary Range Filter**
   - Purpose: Verify numerical range filtering
   - Range: 190,000 - 210,000
   - Test: `should filter data by salary range`

5. **Dynamic Filter Updates**
   - Purpose: Verify filter state changes
   - Scenario: Change from no filter to department filter
   - Test: `should update filtered data when dashboard focus changes`

## AI Service Tests

### Test Cases

1. **Unfiltered Context**
   - Purpose: Verify complete data sent to LLM without filters
   - Test: `should send all data to LLM when no department focus is specified`
   - Verification Points:
     - Total employee count
     - All departments present
     - Complete salary data

2. **Department-Filtered Context**
   - Purpose: Verify BOD-specific data sent to LLM
   - Test: `should send only BOD data to LLM when BOD department is focused`
   - Verification Points:
     - BOD department presence
     - Back Office absence
     - Correct employee count

3. **Multi-Filter Context**
   - Purpose: Verify complex filtered data sent to LLM
   - Test: `should send filtered data to LLM when using multiple filters`
   - Filters Verified:
     - Department
     - Position
     - Division

4. **Salary Range Context**
   - Purpose: Verify salary-filtered data sent to LLM
   - Test: `should send salary range filtered data to LLM`
   - Verification:
     - Correct employees within range
     - Excluded employees outside range

5. **Metrics Accuracy**
   - Purpose: Verify calculated metrics in filtered context
   - Test: `should include correct metrics in filtered context`
   - Metrics Verified:
     - Total salary
     - Average salary
     - Employee count

6. **Chat Context Filtering**
   - Purpose: Verify filtered context in chat messages
   - Test: `should handle chat messages with filtered context`
   - Verification:
     - Filtered department data
     - Correct employee count
     - Excluded departments

7. **Filter Consistency**
   - Purpose: Verify consistent filtering across requests
   - Test: `should maintain consistent filtering across multiple requests`
   - Verification:
     - Context consistency
     - Filter persistence

## Running the Tests

```bash
# Run all filtering tests
npm test src/components/dashboard/__tests__/AIDashboard.test.tsx src/services/__tests__/ai-filtering.test.ts

# Run UI component tests only
npm test src/components/dashboard/__tests__/AIDashboard.test.tsx

# Run AI service tests only
npm test src/services/__tests__/ai-filtering.test.ts
```

## Test Coverage Areas

1. **Data Filtering**
   - Department filtering
   - Position filtering
   - Division filtering
   - Salary range filtering
   - Multiple criteria filtering

2. **UI Components**
   - Table component filtering
   - Chart component filtering
   - Filter state management
   - Dynamic updates

3. **AI Context Generation**
   - Context filtering
   - Metrics calculation
   - Data consistency
   - Chat message context

## Best Practices

1. **Test Isolation**
   - Clear mocks before each test
   - Use independent test data
   - Avoid shared state

2. **Verification Strategy**
   - Check both presence and absence
   - Verify exact values where possible
   - Test edge cases

3. **Maintenance**
   - Keep mock data up to date
   - Document test purposes
   - Use descriptive test names

## Known Limitations

1. **UI Tests**
   - Limited chart rendering verification
   - No animation testing
   - Basic style testing only

2. **AI Service Tests**
   - Mock LLM responses
   - No actual API calls
   - Limited error simulation

## Future Improvements

1. **Additional Test Cases**
   - Error handling scenarios
   - Edge case coverage
   - Performance testing

2. **Enhanced Verification**
   - Chart data verification
   - Style verification
   - Animation testing

3. **Integration Testing**
   - End-to-end filtering flows
   - Real API integration tests
   - Performance benchmarks 