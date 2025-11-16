# Backend Test Suite

Comprehensive test suite for the Mini Competition Dashboard backend API.

## Test Structure

```
tests/
├── setup.ts                    # Test setup and teardown
├── helpers.ts                  # Test helper functions
├── auth.test.ts                # Auth service tests
├── auth.api.test.ts            # Auth API endpoint tests
├── competitions.api.test.ts    # Competitions API endpoint tests
├── competition.service.test.ts  # Competition service tests
├── admin.test.ts               # Admin API tests (existing)
├── middleware.test.ts           # Middleware tests
└── integration.test.ts         # End-to-end integration tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run specific test file
```bash
npm test -- auth.api.test.ts
```

### Run tests with coverage
```bash
npm test -- --coverage
```

## Test Categories

### 1. Unit Tests
- **auth.test.ts**: Tests for authentication service functions
- **competition.service.test.ts**: Tests for competition service functions

### 2. API Tests
- **auth.api.test.ts**: Tests for authentication endpoints
  - User registration
  - User login
  - Get current user
  - Validation and error handling

- **competitions.api.test.ts**: Tests for competition endpoints
  - List competitions (pagination, search, sort, filter)
  - Get competition by ID
  - Get chart data
  - Create competition
  - Join competition

- **admin.test.ts**: Tests for admin endpoints
  - Admin CRUD operations
  - Role-based access control
  - Participant listing

### 3. Middleware Tests
- **middleware.test.ts**: Tests for middleware functions
  - Authentication middleware
  - Admin middleware
  - Rate limiting
  - Error handling
  - CORS

### 4. Integration Tests
- **integration.test.ts**: End-to-end user flows
  - Complete registration and competition flow
  - Search and filter flows
  - Admin CRUD flows
  - Error handling flows

## Test Coverage

The test suite covers:

✅ **Authentication**
- User registration with validation
- User login
- JWT token generation and verification
- Role-based access

✅ **Competitions**
- CRUD operations
- Pagination, search, sorting, filtering
- Join functionality
- Chart data generation

✅ **Admin Operations**
- Admin-only endpoints
- Competition management
- Participant viewing

✅ **Error Handling**
- Validation errors
- Authentication errors
- Authorization errors
- Not found errors
- Conflict errors

✅ **Middleware**
- Authentication middleware
- Admin role checking
- Rate limiting
- Error handling

## Test Database

Tests use a separate test database:
- **URI**: `mongodb://localhost:27017/mini_competition_test`
- **Environment Variable**: `MONGO_TEST_URI`

The database is cleaned before each test to ensure test isolation.

## Test Helpers

The `helpers.ts` file provides utility functions:
- `createTestUser()`: Create a test user and get token
- `createTestCompetition()`: Create a test competition
- `createTestParticipation()`: Create a test participation
- `cleanupTestData()`: Clean all test data

## Writing New Tests

### Example Test Structure

```typescript
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { createTestUser, cleanupTestData } from './helpers';

const MONGO_TEST_URI =
  process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/mini_competition_test';

describe('Your Test Suite', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_TEST_URI);
    }
  });

  afterAll(async () => {
    await cleanupTestData();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  it('should test something', async () => {
    // Your test code
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Helpers**: Use helper functions for common operations
4. **Descriptive Names**: Use clear test descriptions
5. **Assertions**: Make specific assertions
6. **Error Cases**: Test both success and error scenarios

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- Use environment variables for configuration
- Clean database state between tests
- No external dependencies required
- Fast execution time

## Troubleshooting

### Tests failing with connection errors
- Ensure MongoDB is running
- Check `MONGO_TEST_URI` environment variable
- Verify database permissions

### Tests interfering with each other
- Ensure `cleanupTestData()` is called in `beforeEach`
- Check for shared state between tests

### Timeout errors
- Increase Jest timeout if needed
- Check for hanging database connections

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Run `npm test -- --coverage` to see current coverage.

