# Clinic Management System - Backend API

A comprehensive backend API for managing clinic patients, visits, and user authentication.

## Features

- **User Authentication**: Sign up and login with JWT tokens
- **Patient Management**: Full CRUD operations for patients
- **Visit Tracking**: Automatic tracking of patient visits with 3 free visits policy
- **Charge Management**: Track charges and payment status for visits

## Tech Stack

- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/clinic-management
JWT_SECRET=your-secret-key-here
```

4. Make sure MongoDB is running on your system

5. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication

#### Sign Up
- **POST** `/api/auth/signup`
- **Body**: 
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "staff" // optional, defaults to "staff"
  }
  ```

#### Login
- **POST** `/api/auth/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Get Profile
- **GET** `/api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`

### Patients

#### Create Patient
- **POST** `/api/patients`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "idCard": "1234567890",
    "name": "John Doe",
    "charges": 100 // optional
  }
  ```

#### Get All Patients
- **GET** `/api/patients?page=1&limit=10&search=john`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search by ID card or name

#### Get Patient by ID
- **GET** `/api/patients/:id`
- **Headers**: `Authorization: Bearer <token>`

#### Update Patient
- **PUT** `/api/patients/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "John Updated",
    "charges": 150
  }
  ```

#### Delete Patient
- **DELETE** `/api/patients/:id`
- **Headers**: `Authorization: Bearer <token>`

### Visits

#### Record Visit
- **POST** `/api/patients/:id/visits`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "notes": "Regular checkup",
    "charges": 100 // optional, uses patient's default charges if not provided
  }
  ```
- **Note**: First 3 visits are automatically free. After that, charges apply.

#### Get Patient Visits
- **GET** `/api/patients/:id/visits`
- **Headers**: `Authorization: Bearer <token>`

#### Mark Visit as Paid
- **PATCH** `/api/patients/visits/:visitId/paid`
- **Headers**: `Authorization: Bearer <token>`

## Business Logic

- **Free Visits**: Each patient gets 3 free visits automatically
- **Charges**: After 3 visits, patients must pay charges (default or specified)
- **Visit Tracking**: All visits are tracked with visit numbers, dates, and payment status

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error message",
  "errors": [ ... ] // for validation errors
}
```

## Architecture Suggestions

### Frontend (Next.js)
- Use Next.js 14+ with App Router
- Implement authentication context/provider
- Create reusable components for forms and tables
- Use React Query or SWR for data fetching

### Desktop App Options

1. **Electron** (Recommended)
   - Most popular and mature
   - Large community and ecosystem
   - Easy to package and distribute
   - Can use existing Next.js app

2. **Tauri**
   - Smaller bundle size
   - Better security
   - Uses system webview
   - Rust-based backend

3. **Nextron**
   - Specifically for Next.js + Electron
   - Pre-configured setup
   - Easy integration

### Recommended Architecture

```
┌─────────────────────────────────────┐
│         Desktop Application         │
│  ┌───────────────────────────────┐ │
│  │      Next.js Frontend          │ │
│  │  - Login/Signup Pages          │ │
│  │  - Dashboard                   │ │
│  │  - Patient CRUD                │ │
│  │  - Visit Management            │ │
│  └───────────────────────────────┘ │
│           │                         │
│           ▼                         │
│  ┌───────────────────────────────┐ │
│  │    Electron/Tauri Wrapper     │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
           │
           ▼ HTTP/HTTPS
┌─────────────────────────────────────┐
│      Express.js Backend API         │
│  - Authentication                   │
│  - Patient Management               │
│  - Visit Tracking                   │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│         MongoDB Database            │
│  - Users                            │
│  - Patients                         │
│  - Visits                           │
└─────────────────────────────────────┘
```

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Production

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Use a production MongoDB instance
4. Enable CORS for your frontend domain
5. Use a process manager like PM2

## License

MIT

