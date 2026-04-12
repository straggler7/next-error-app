# Unit Testing Guide for IRS Error Resolution System

This document provides comprehensive guidelines for unit testing in the Next.js React application using Jest and React Testing Library.

## Table of Contents

- [Overview](#overview)
- [Testing Setup](#testing-setup)
- [Test Structure](#test-structure)
- [Testing Patterns](#testing-patterns)
- [Best Practices](#best-practices)
- [Running Tests](#running-tests)
- [Coverage Requirements](#coverage-requirements)
- [Troubleshooting](#troubleshooting)

## Overview

The testing framework uses:
- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom Jest matchers for DOM elements
- **@testing-library/user-event**: User interaction simulation

## Testing Setup

### Configuration Files

#### `jest.config.js`
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/error.tsx',
    '!src/middleware.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### `jest.setup.js`
```javascript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock storage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage,
})

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
})
```

## Test Structure

### Folder Organization
```
src/
├── __tests__/
│   ├── components/
│   ├── services/
│   ├── utils/
│   ├── hooks/
│   └── utils/
│       └── testHelpers.ts
├── __mocks__/
│   ├── next/
│   └── services/
```

### File Naming Conventions
- Test files: `*.test.ts` or `*.test.tsx`
- Mock files: `__mocks__/[module-name].ts`
- Helper files: `testHelpers.ts`

## Testing Patterns

### 1. Utility Function Tests

```typescript
// Example: src/__tests__/utils/serviceCenters.test.ts
import { getServiceCenterName } from '@/utils/serviceCenters';

describe('serviceCenters utility', () => {
  describe('getServiceCenterName', () => {
    it('should return correct service center name for valid code', () => {
      expect(getServiceCenterName(16)).toBe('Andover');
    });

    it('should return fallback for unknown code', () => {
      expect(getServiceCenterName(999)).toBe('Service Center 999');
    });
  });
});
```

### 2. Service Layer Tests

```typescript
// Example: src/__tests__/services/reportsService.test.ts
import { ReportsService } from '@/services/reportsService';

describe('ReportsService', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('should fetch report data successfully', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    } as any);

    const result = await ReportsService.get1340Report('12345', payload);
    expect(result).toEqual(mockData);
  });
});
```

### 3. React Component Tests

```typescript
// Example: src/__tests__/components/LoadingSpinner.test.tsx
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '@/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default medium size', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('w-8');
    expect(spinner.className).toContain('h-8');
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('custom-class');
  });
});
```

### 4. Hook Tests

```typescript
// Example: src/__tests__/hooks/useApi.test.ts
import { renderHook } from '@testing-library/react';
import { useApi } from '@/hooks/useApi';

describe('useApi', () => {
  it('should handle successful API calls', async () => {
    const { result } = renderHook(() => useApi());
    
    // Test hook behavior
    expect(result.current.loading).toBe(false);
  });
});
```

## Best Practices

### 1. Test Organization
- **Group related tests** using `describe` blocks
- **Use descriptive test names** that explain the expected behavior
- **Follow AAA pattern**: Arrange, Act, Assert

### 2. Mocking Guidelines
- **Mock external dependencies** (APIs, third-party libraries)
- **Use Jest mocks** for modules that don't need real implementation
- **Reset mocks** between tests using `beforeEach` or `afterEach`

### 3. Component Testing
- **Test user interactions** rather than implementation details
- **Use semantic queries** (`getByRole`, `getByLabelText`, etc.)
- **Test accessibility** features when applicable
- **Mock complex child components** to isolate testing

### 4. Async Testing
- **Use async/await** for asynchronous operations
- **Wait for elements** using `waitFor` or `findBy` queries
- **Mock timers** when testing time-dependent code

### 5. Error Handling
- **Test both success and failure scenarios**
- **Verify error messages** and error states
- **Test edge cases** and boundary conditions

## Running Tests

### Available Scripts
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Running Specific Tests
```bash
# Run tests for a specific file
npm test -- --testPathPatterns=LoadingSpinner.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="should render"

# Run tests for a specific directory
npm test -- src/__tests__/utils/
```

## Coverage Requirements

### Current Thresholds
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports
Coverage reports are generated in the `coverage/` directory and include:
- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- JSON format: `coverage/coverage-final.json`

### Excluded Files
The following files are excluded from coverage:
- Type definition files (`*.d.ts`)
- Next.js layout files
- Loading and error pages
- Middleware files

## Troubleshooting

### Common Issues

#### 1. Module Resolution Errors
**Problem**: Cannot resolve module paths
**Solution**: Check `moduleNameMapper` in `jest.config.js`

#### 2. DOM Testing Issues
**Problem**: Elements not found or DOM queries failing
**Solution**: 
- Use `screen.debug()` to see rendered output
- Check if elements are properly rendered
- Use appropriate queries (`getByRole`, `getByText`, etc.)

#### 3. Async Test Failures
**Problem**: Tests failing due to timing issues
**Solution**:
- Use `waitFor` for async operations
- Mock timers with `jest.useFakeTimers()`
- Ensure proper cleanup in `afterEach`

#### 4. Mock Issues
**Problem**: Mocks not working as expected
**Solution**:
- Clear mocks between tests
- Check mock implementation
- Verify mock is applied before component render

### Debugging Tips

1. **Use `screen.debug()`** to see rendered DOM
2. **Add `console.log`** statements in tests (temporarily)
3. **Run single tests** to isolate issues
4. **Check Jest output** for detailed error messages
5. **Use `--verbose`** flag for detailed test output

## Test Helpers

### Available Helpers (`src/__tests__/utils/testHelpers.ts`)

```typescript
// Mock data generators
export const mockEraDto = { /* ... */ };
export const mockUserProfile = { /* ... */ };

// API response helpers
export const mockApiResponse = (data, status = 200) => ({ /* ... */ });
export const mockApiError = (message, status = 500) => ({ /* ... */ });

// Storage helpers
export const mockSessionStorage = () => ({ /* ... */ });

// Render helpers
export const renderWithProviders = (ui, options) => ({ /* ... */ });
```

## Future Enhancements

### Planned Improvements
1. **Integration Tests**: Add tests for complete user workflows
2. **E2E Tests**: Implement Playwright or Cypress tests
3. **Visual Regression**: Add screenshot testing
4. **Performance Tests**: Add performance benchmarking
5. **Accessibility Tests**: Expand a11y testing coverage

### Additional Tools to Consider
- **MSW (Mock Service Worker)**: For API mocking
- **Storybook**: For component documentation and testing
- **Playwright**: For end-to-end testing
- **axe-core**: For accessibility testing

## Contributing

When adding new tests:
1. Follow the established patterns and conventions
2. Ensure tests are isolated and don't depend on each other
3. Add appropriate mocks for external dependencies
4. Update this documentation if adding new patterns
5. Maintain or improve coverage thresholds

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
