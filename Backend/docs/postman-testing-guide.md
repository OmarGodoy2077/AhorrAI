# AhorraAI Backend - Postman Testing Guide

This guide provides step-by-step instructions for testing the AhorraAI backend API endpoints using Postman. It covers all routes, including request setup, headers, body examples, and expected responses.

## Setup

1. **Base URL**: `http://localhost:3000/api`
2. **Authentication**: Most endpoints require a JWT token in the Authorization header: `Bearer <your_jwt_token>`
3. **Import into Postman**: You can create a new collection in Postman and add these requests, or import from the provided examples.
4. **Variables**: Use Postman variables for the base URL and JWT token to make testing easier (e.g., `{{base_url}}` and `{{token}}`).

## Authentication Endpoints

### 1. POST {{base_url}}/auth/register
Register a new user.

- **Method**: POST
- **Headers**:
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "salary": 5000,
    "savingsGoal": 1000
  }
  ```
- **Expected Response** (201):
  ```json
  {
    "message": "User registered successfully",
    "token": "jwt_token_here",
    "profile": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "salary": 5000,
      "savings_goal": 1000,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  }
  ```
- **Postman Tips**: After successful registration, save the token to a variable for use in other requests.

### 2. POST {{base_url}}/auth/login
Login an existing user.

- **Method**: POST
- **Headers**:
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Expected Response** (200):
  ```json
  {
    "message": "Login successful",
    "token": "jwt_token_here",
    "profile": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "salary": 5000,
      "savings_goal": 1000,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  }
  ```
- **Postman Tips**: Save the token to a variable after login.

## Profile Endpoints

All profile endpoints require authentication (use Bearer token).

### 3. GET {{base_url}}/profile
Get user profile.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200):
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "salary": 5000,
    "savings_goal": 1000,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
  ```

### 4. PUT {{base_url}}/profile
Update user profile.

- **Method**: PUT
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "salary": 5500,
    "savingsGoal": 1100
  }
  ```
- **Expected Response** (200): Updated profile object.

### 5. DELETE {{base_url}}/profile
Delete user profile.

- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Success message or empty response.

## Financial Settings Endpoints

### 6. POST {{base_url}}/financial-settings
Create financial setting.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "salary": 5000,
    "savings_goal": 1000,
    "start_date": "2023-01-01",
    "end_date": null
  }
  ```
- **Expected Response** (201): Created setting object.

### 7. GET {{base_url}}/financial-settings
Get all financial settings (paginated).

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Query Parameters**:
  - page: 1 (default)
  - limit: 10 (default)
  - sortBy: (varies)
  - sortOrder: desc (default)
- **Expected Response** (200):
  ```json
  {
    "data": [],
    "page": 1,
    "limit": 10
  }
  ```

### 8. GET {{base_url}}/financial-settings/current
Get current active setting.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Current setting object.

### 9. GET {{base_url}}/financial-settings/:id
Get specific financial setting.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Setting object.

### 10. PUT {{base_url}}/financial-settings/:id
Update financial setting.

- **Method**: PUT
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON): Similar to POST.
- **Expected Response** (200): Updated setting.

### 11. DELETE {{base_url}}/financial-settings/:id
Delete financial setting.

- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Success message.

## Income Endpoints

### 12. POST {{base_url}}/incomes
Create income.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "name": "Salary",
    "type": "fixed",
    "amount": 5000,
    "frequency": "monthly"
  }
  ```
- **Expected Response** (201): Created income object.

### 13. GET {{base_url}}/incomes
Get all incomes (paginated).

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Query Parameters**: Same as financial settings.
- **Expected Response** (200): Paginated array of incomes.

### 14. GET {{base_url}}/incomes/:id
Get specific income.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Income object.

### 15. PUT {{base_url}}/incomes/:id
Update income.

- **Method**: PUT
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON): Similar to POST.
- **Expected Response** (200): Updated income.

### 16. DELETE {{base_url}}/incomes/:id
Delete income.

- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Success message.

### 17. POST {{base_url}}/incomes/:id/confirm
Confirm income receipt.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Updated income object.

## Expense Endpoints

### 18. POST {{base_url}}/expenses
Create expense.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "description": "Groceries",
    "amount": 200,
    "date": "2023-01-01",
    "type": "variable",
    "category_id": "category_uuid"
  }
  ```
- **Expected Response** (201): Created expense object.

### 19. GET {{base_url}}/expenses
Get all expenses (paginated).

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Paginated array of expenses.

### 20. GET {{base_url}}/expenses/:id
Get specific expense.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Expense object.

### 21. PUT {{base_url}}/expenses/:id
Update expense.

- **Method**: PUT
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Expected Response** (200): Updated expense.

### 22. DELETE {{base_url}}/expenses/:id
Delete expense.

- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Success message.

## Account Endpoints

### 23. POST {{base_url}}/accounts
Create account.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "name": "Bank Account",
    "type": "bank",
    "balance": 1000,
    "currency": "GTQ"
  }
  ```
- **Expected Response** (201): Created account object.

### 24. GET {{base_url}}/accounts
Get all accounts (paginated).

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Paginated array of accounts.

### 25. GET {{base_url}}/accounts/:id
Get specific account.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Account object.

### 26. PUT {{base_url}}/accounts/:id
Update account.

- **Method**: PUT
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Expected Response** (200): Updated account.

### 27. DELETE {{base_url}}/accounts/:id
Delete account.

- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Success message.

## Category Endpoints

### 28. POST {{base_url}}/categories
Create category.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "name": "Food",
    "type": "necessary",
    "color": "#FF0000"
  }
  ```
- **Expected Response** (201): Created category object.

### 29. GET {{base_url}}/categories
Get all categories (paginated).

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Paginated array of categories.

### 30. GET {{base_url}}/categories/:id
Get specific category.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Category object.

### 31. PUT {{base_url}}/categories/:id
Update category.

- **Method**: PUT
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Expected Response** (200): Updated category.

### 32. DELETE {{base_url}}/categories/:id
Delete category.

- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Success message.

## Loan Endpoints

### 33. POST {{base_url}}/loans
Create loan.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "name": "Personal Loan",
    "amount": 10000,
    "interest_rate": 5.0,
    "start_date": "2023-01-01",
    "end_date": "2025-01-01",
    "remaining_balance": 8000,
    "status": "active"
  }
  ```
- **Expected Response** (201): Created loan object.

### 34. GET {{base_url}}/loans
Get all loans (paginated).

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Paginated array of loans.

### 35. GET {{base_url}}/loans/:id
Get specific loan.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Loan object.

### 36. PUT {{base_url}}/loans/:id
Update loan.

- **Method**: PUT
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Expected Response** (200): Updated loan.

### 37. DELETE {{base_url}}/loans/:id
Delete loan.

- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Success message.

## Savings Goal Endpoints

### 38. POST {{base_url}}/savings-goals
Create savings goal.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "name": "Vacation Fund",
    "target_amount": 10000,
    "current_amount": 0,
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "status": "active"
  }
  ```
- **Expected Response** (201): Created goal object.

### 39. GET {{base_url}}/savings-goals
Get all savings goals (paginated).

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Paginated array of goals.

### 40. GET {{base_url}}/savings-goals/:id
Get specific savings goal.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Goal object.

### 41. PUT {{base_url}}/savings-goals/:id
Update savings goal.

- **Method**: PUT
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Expected Response** (200): Updated goal.

### 42. DELETE {{base_url}}/savings-goals/:id
Delete savings goal.

- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Success message.

### 43. POST {{base_url}}/savings-goals/:id/set-primary
Set goal as primary.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Updated goal object.

### 44. POST {{base_url}}/savings-goals/:id/deposit
Deposit to savings goal.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "amount": 500
  }
  ```
- **Expected Response** (200): Updated goal object.

## Spending Limit Endpoints

### 45. POST {{base_url}}/spending-limits
Create spending limit.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "monthly_limit": 1000,
    "year": 2023,
    "month": 10
  }
  ```
- **Expected Response** (201): Created spending limit object.

### 46. GET {{base_url}}/spending-limits
Get all spending limits (paginated).

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Paginated array of limits.

### 47. GET {{base_url}}/spending-limits/:id
Get specific spending limit.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Spending limit object.

### 48. GET {{base_url}}/spending-limits/:year/:month
Get limit for specific month.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Spending limit object.

### 49. GET {{base_url}}/spending-limits/:year/:month/status
Check spending status for month.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Status object.

### 50. PUT {{base_url}}/spending-limits/:id
Update spending limit.

- **Method**: PUT
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Expected Response** (200): Updated limit.

### 51. DELETE {{base_url}}/spending-limits/:id
Delete spending limit.

- **Method**: DELETE
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Success message.

## Summary Endpoints

### 52. GET {{base_url}}/summaries/monthly/:year/:month
Get monthly summary.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200):
  ```json
  {
    "id": "uuid",
    "user_id": "user_uuid",
    "year": 2023,
    "month": 1,
    "total_income": 5000,
    "total_expenses": 2000,
    "net_change": 3000
  }
  ```

### 53. GET {{base_url}}/summaries/yearly/:year
Get yearly summary.

- **Method**: GET
- **Headers**:
  - Authorization: Bearer {{token}}
- **Expected Response** (200): Yearly summary object.

### 54. POST {{base_url}}/summaries/monthly/generate
Generate monthly summary.

- **Method**: POST
- **Headers**:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
- **Body** (raw JSON):
  ```json
  {
    "year": 2023,
    "month": 1
  }
  ```
- **Expected Response** (200): Generated summary object.

## Currency and Health Endpoints

### 55. GET {{base_url}}/currencies
Get all currencies (no auth required).

- **Method**: GET
- **Expected Response** (200): Array of currency objects.

### 56. GET {{base_url}}/health
API health check (no auth required).

- **Method**: GET
- **Expected Response** (200): Health status.

## Error Handling

- **Validation Errors** (400):
  ```json
  {
    "error": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email"
      }
    ]
  }
  ```
- **Other Errors** (400/401/500):
  ```json
  {
    "error": "Error message"
  }
  ```

## Tips for Postman

1. **Environment Variables**: Set `base_url` to `http://localhost:3000/api` and `token` to your JWT.
2. **Tests**: Add tests in Postman to verify response codes and data.
3. **Run Server**: Ensure the backend server is running on port 3000.
4. **Pagination**: Use query params for paginated endpoints.
5. **Timezone**: All timestamps are in America/Guatemala (UTC-6).