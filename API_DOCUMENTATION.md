# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Database
This API uses **PostgreSQL** as its database. Make sure you have PostgreSQL installed and running.

### Environment Variables
Create a `.env` file in the root directory with the following:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

## Authentication

All patient-related endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Authentication Endpoints

### 1. Sign Up
Create a new user account.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "staff"  // optional: "admin" or "staff" (default: "staff")
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "staff"
  }
}
```

**Error Responses:**
- `400`: Validation errors or user already exists
- `500`: Server error

---

### 2. Login
Authenticate and get access token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "staff"
  }
}
```

**Error Responses:**
- `401`: Invalid credentials
- `400`: Validation errors
- `500`: Server error

---

### 3. Get Profile
Get current user's profile.

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "staff",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: Unauthorized (invalid or missing token)
- `404`: User not found
- `500`: Server error

---

### 4. Forgot Password
Request a password reset token.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset token generated successfully",
  "resetToken": "a1b2c3d4e5f6...",
  "note": "In production, this token should be sent via email, not in response"
}
```

**Notes:**
- For security, this endpoint returns a success message even if the email doesn't exist
- In production, the `resetToken` should be sent via email to the user, not returned in the response
- The reset token expires after 1 hour
- Send the token as a link like: `http://yourapp.com/reset-password?token=<resetToken>`

**Error Responses:**
- `400`: Validation errors (invalid email format)
- `500`: Server error

---

### 5. Reset Password
Reset password using the token received from forgot password.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**
- `400`: Invalid or expired token, or validation errors
- `500`: Server error

---

## Patient Endpoints

### 1. Create Patient
Create a new patient record.

**Endpoint:** `POST /api/patients`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "idCard": "1234567890",
  "name": "John Doe",
  "dateOfBirth": "1990-05-15",  // optional, format: YYYY-MM-DD
  "type": "man",  // optional, values: "child", "man", "woman"
  "charges": 100,  // optional, default: 0
  "visitCount": 0  // optional, default: 0 (for imports)
}
```

**Response (201 Created):**
```json
{
  "message": "Patient created successfully",
  "patient": {
    "id": 1,
    "idCard": "1234567890",
    "name": "John Doe",
    "dateOfBirth": "1990-05-15",
    "type": "man",
    "charges": 100,
    "visitCount": 0,
    "isActive": true,
    "createdBy": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation errors or patient with ID card already exists
- `401`: Unauthorized
- `500`: Server error

---

### 2. Bulk Import Patients
Bulk import multiple patients at once (useful for CSV/Excel imports).

**Endpoint:** `POST /api/patients/import`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "patients": [
    {
      "idCard": "A12345",
      "name": "John Doe",
      "dateOfBirth": "1990-05-15",
      "type": "man",
      "charges": 100,
      "visitCount": 2
    },
    {
      "idCard": "B67890",
      "name": "Jane Smith",
      "dateOfBirth": "1985-08-20",
      "type": "woman",
      "charges": 150,
      "visitCount": 0
    }
  ]
}
```

**Field Requirements:**
- `idCard` (required): String, 1-50 characters
- `name` (required): String, 2-100 characters
- `dateOfBirth` (optional): String, format: YYYY-MM-DD
- `type` (optional): String, values: "child", "man", "woman"
- `charges` (optional): Number >= 0, default: 0
- `visitCount` (optional): Integer >= 0, default: 0

**Response (201 Created):**
```json
{
  "message": "Import completed: 2 succeeded, 0 failed",
  "results": {
    "success": [
      {
        "index": 0,
        "idCard": "A12345",
        "name": "John Doe",
        "id": 1
      },
      {
        "index": 1,
        "idCard": "B67890",
        "name": "Jane Smith",
        "id": 2
      }
    ],
    "failed": [],
    "total": 2,
    "successCount": 2,
    "failedCount": 0
  }
}
```

**Partial Success Response (201 Created):**
```json
{
  "message": "Import completed: 1 succeeded, 1 failed",
  "results": {
    "success": [
      {
        "index": 0,
        "idCard": "A12345",
        "name": "John Doe",
        "id": 1
      }
    ],
    "failed": [
      {
        "index": 1,
        "idCard": "B67890",
        "name": "Jane Smith",
        "error": "Patient with ID card B67890 already exists"
      }
    ],
    "total": 2,
    "successCount": 1,
    "failedCount": 1
  }
}
```

**Error Responses:**
- `400`: Invalid request body (not an array, empty array, or all imports failed)
- `401`: Unauthorized
- `500`: Server error

---

### 3. Get All Patients
Retrieve a list of all patients with pagination and search.

**Endpoint:** `GET /api/patients`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by ID card or name

**Example:** `GET /api/patients?page=1&limit=10&search=john`

**Response (200 OK):**
```json
{
  "patients": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "idCard": "1234567890",
      "name": "John Doe",
      "dateOfBirth": "1990-05-15",
      "type": "man",
      "charges": 100,
      "visitCount": 2,
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "admin",
        "email": "admin@clinic.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 4. Get Patient by ID
Get detailed information about a specific patient including their visits.

**Endpoint:** `GET /api/patients/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "patient": {
    "_id": "507f1f77bcf86cd799439011",
    "idCard": "1234567890",
    "name": "John Doe",
    "dateOfBirth": "1990-05-15",
    "type": "man",
    "charges": 100,
    "visitCount": 2,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "admin",
      "email": "admin@clinic.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "visits": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "patient": "507f1f77bcf86cd799439011",
      "visitNumber": 1,
      "isFreeVisit": true,
      "charges": 0,
      "paid": true,
      "notes": "Initial consultation",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "patient": "507f1f77bcf86cd799439011",
      "visitNumber": 2,
      "isFreeVisit": true,
      "charges": 0,
      "paid": true,
      "notes": "Follow-up",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "currentMonthVisits": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "patient": "507f1f77bcf86cd799439011",
      "visitNumber": 2,
      "isFreeVisit": true,
      "charges": 0,
      "paid": true,
      "notes": "Follow-up",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "monthlyVisitCount": 1,
  "remainingFreeVisitsThisMonth": 2
}
```

**Error Responses:**
- `404`: Patient not found
- `401`: Unauthorized
- `500`: Server error

---

### 5. Update Patient
Update patient information.

**Endpoint:** `PUT /api/patients/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "dateOfBirth": "1990-06-20",
  "type": "man",
  "charges": 150
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response (200 OK):**
```json
{
  "message": "Patient updated successfully",
  "patient": {
    "_id": "507f1f77bcf86cd799439011",
    "idCard": "1234567890",
    "name": "John Updated",
    "dateOfBirth": "1990-06-20",
    "type": "man",
    "charges": 150,
    "visitCount": 2,
    "isActive": true,
    "updatedAt": "2024-01-03T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Patient not found
- `400`: Validation errors
- `401`: Unauthorized
- `500`: Server error

---

### 6. Delete Patient
Delete a patient and all associated visits.

**Endpoint:** `DELETE /api/patients/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Patient deleted successfully"
}
```

**Error Responses:**
- `404`: Patient not found
- `401`: Unauthorized
- `500`: Server error

---

## Visit Endpoints

### 1. Record Visit
Record a new visit for a patient. First 3 visits per month are automatically free.

**Endpoint:** `POST /api/patients/:id/visits`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notes": "Regular checkup",
  "charges": 100  // optional, uses patient's default charges if not provided
}
```

**Response (201 Created):**
```json
{
  "message": "Visit recorded successfully",
  "visit": {
    "_id": "507f1f77bcf86cd799439015",
    "patient": "507f1f77bcf86cd799439011",
    "visitNumber": 15,
    "isFreeVisit": true,
    "charges": 0,
    "paid": true,
    "notes": "Regular checkup",
    "createdBy": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-03T00:00:00.000Z"
  },
  "patient": {
    "visitCount": 15,
    "monthlyVisitCount": 2,
    "remainingFreeVisitsThisMonth": 1
  }
}
```

**Business Logic:**
- **Monthly Reset:** Each patient gets 3 free visits per calendar month
- **Month 1-3 visits:** Automatically free (`isFreeVisit: true`, `charges: 0`, `paid: true`)
- **Month 4+ visits:** Charges apply (`isFreeVisit: false`, `charges: <amount>`, `paid: false`)
- **Next Month:** Visit count resets to 0, patient gets 3 new free visits
- **Total visitCount:** Tracks lifetime visits across all months

**Error Responses:**
- `404`: Patient not found
- `400`: Validation errors
- `401`: Unauthorized
- `500`: Server error

---

### 2. Get Patient Visits
Get all visits for a specific patient, including current month's visits.

**Endpoint:** `GET /api/patients/:id/visits`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "visits": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "patient": "507f1f77bcf86cd799439011",
      "visitNumber": 1,
      "isFreeVisit": true,
      "charges": 0,
      "paid": true,
      "notes": "Initial consultation",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "currentMonthVisits": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "patient": "507f1f77bcf86cd799439011",
      "visitNumber": 1,
      "isFreeVisit": true,
      "charges": 0,
      "paid": true,
      "notes": "Initial consultation",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "patient": {
    "visitCount": 1,
    "monthlyVisitCount": 1,
    "remainingFreeVisitsThisMonth": 2
  }
}
```

**Response Fields:**
- `visits`: All visits for this patient (all time)
- `currentMonthVisits`: Visits from the current calendar month only
- `patient.visitCount`: Total lifetime visit count
- `patient.monthlyVisitCount`: Number of visits this month
- `patient.remainingFreeVisitsThisMonth`: Free visits remaining this month (0-3)
```

---

### 3. Mark Visit as Paid
Mark a visit as paid (for visits after the 3 free monthly visits).

**Endpoint:** `PATCH /api/patients/visits/:visitId/paid`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Visit marked as paid",
  "visit": {
    "_id": "507f1f77bcf86cd799439016",
    "patient": "507f1f77bcf86cd799439011",
    "visitNumber": 4,
    "isFreeVisit": false,
    "charges": 100,
    "paid": true,
    "notes": "Regular checkup",
    "updatedAt": "2024-01-04T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Visit not found
- `400`: Visit already marked as paid
- `401`: Unauthorized
- `500`: Server error

---

### 4. Cleanup Old Visit Records
Delete visit records older than specified months (for maintenance/cleanup). This helps keep the database clean while maintaining current month data.

**Endpoint:** `DELETE /api/patients/visits/cleanup`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `months` (optional): Number of months old (default: 1). Must be at least 1.

**Example:** `DELETE /api/patients/visits/cleanup?months=2`

**Response (200 OK):**
```json
{
  "message": "Successfully cleaned up old visit records",
  "deletedCount": 150,
  "olderThan": "2 month(s)"
}
```

**Notes:**
- Use this endpoint to clean up old visit records after each month
- Current month visits are never deleted
- Consider running this as a scheduled task (cron job) at the start of each month
- Default behavior deletes visits older than 1 month (keeps only current month)

**Error Responses:**
- `400`: Invalid months parameter
- `401`: Unauthorized
- `500`: Server error

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error message",
  "errors": [  // Only for validation errors
    {
      "msg": "Validation error message",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

---

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing or invalid token)
- `404`: Not Found
- `500`: Internal Server Error

---

## Example Usage Flow

1. **Sign Up:**
   ```bash
   POST /api/auth/signup
   Body: { "username": "admin", "email": "admin@clinic.com", "password": "admin123" }
   ```

2. **Login:**
   ```bash
   POST /api/auth/login
   Body: { "email": "admin@clinic.com", "password": "admin123" }
   Response: { "token": "..." }
   ```

3. **Create Patient:**
   ```bash
   POST /api/patients
   Headers: { "Authorization": "Bearer <token>" }
   Body: { "idCard": "12345", "name": "John Doe", "charges": 100 }
   ```

4. **Record First Visit (Free):**
   ```bash
   POST /api/patients/<patient-id>/visits
   Headers: { "Authorization": "Bearer <token>" }
   Body: { "notes": "Initial consultation" }
   ```

5. **Record Fourth Visit (Charged):**
   ```bash
   POST /api/patients/<patient-id>/visits
   Headers: { "Authorization": "Bearer <token>" }
   Body: { "notes": "Regular checkup", "charges": 100 }
   ```

6. **Mark Visit as Paid:**
   ```bash
   PATCH /api/patients/visits/<visit-id>/paid
   Headers: { "Authorization": "Bearer <token>" }
   ```

