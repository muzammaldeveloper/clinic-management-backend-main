# Quick Start Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/clinic-management
JWT_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=development
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clinic-management
```

### 3. Start MongoDB

**Windows:**
```bash
# If MongoDB is installed as a service, it should start automatically
# Or start manually:
mongod
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

### 5. Test the API

**Test the root endpoint:**
```bash
curl http://localhost:5000
```

**Create a user:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@clinic.com",
    "password": "admin123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.com",
    "password": "admin123"
  }'
```

Save the token from the response for authenticated requests.

**Create a patient (replace TOKEN with your actual token):**
```bash
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "idCard": "1234567890",
    "name": "John Doe",
    "charges": 100
  }'
```

## Using Postman or Thunder Client

1. Import the following collection structure:

### Collection: Clinic Management API

#### Folder: Authentication
- **Sign Up**: POST `http://localhost:5000/api/auth/signup`
- **Login**: POST `http://localhost:5000/api/auth/login`
- **Get Profile**: GET `http://localhost:5000/api/auth/profile` (requires auth)

#### Folder: Patients
- **Create Patient**: POST `http://localhost:5000/api/patients` (requires auth)
- **Get All Patients**: GET `http://localhost:5000/api/patients` (requires auth)
- **Get Patient by ID**: GET `http://localhost:5000/api/patients/:id` (requires auth)
- **Update Patient**: PUT `http://localhost:5000/api/patients/:id` (requires auth)
- **Delete Patient**: DELETE `http://localhost:5000/api/patients/:id` (requires auth)

#### Folder: Visits
- **Record Visit**: POST `http://localhost:5000/api/patients/:id/visits` (requires auth)
- **Get Patient Visits**: GET `http://localhost:5000/api/patients/:id/visits` (requires auth)
- **Mark Visit Paid**: PATCH `http://localhost:5000/api/patients/visits/:visitId/paid` (requires auth)

2. Set up environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `token`: (set after login)

3. For authenticated requests, add header:
   - Key: `Authorization`
   - Value: `Bearer {{token}}`

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check the `MONGODB_URI` in `.env`
- For local MongoDB, verify it's running on port 27017

### Port Already in Use
- Change `PORT` in `.env` to a different port (e.g., 5001)
- Or stop the process using port 5000

### Module Not Found Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### JWT Token Errors
- Ensure `JWT_SECRET` is set in `.env`
- Use a strong, random string for production

## Next Steps

1. Test all endpoints using Postman or curl
2. Integrate with your Next.js frontend
3. Set up your desktop app wrapper (Electron/Tauri)
4. Deploy to production

## Desktop App Recommendations

### Option 1: Electron (Recommended)
- **Pros**: Mature, large community, easy to package
- **Setup**: Use `nextron` for Next.js + Electron integration
- **Install**: `npx create-nextron-app clinic-desktop`

### Option 2: Tauri
- **Pros**: Smaller bundle, better security, uses system webview
- **Setup**: More complex, requires Rust knowledge
- **Best for**: Performance-critical applications

### Option 3: Nextron
- **Pros**: Pre-configured for Next.js + Electron
- **Setup**: Simplest option for Next.js apps
- **Install**: `npx create-nextron-app clinic-desktop`

## Architecture Overview

```
┌─────────────────────────────────────────┐
│      Desktop Application (Electron)     │
│  ┌───────────────────────────────────┐  │
│  │      Next.js Frontend             │  │
│  │  - Pages: Login, Signup, Dashboard│  │
│  │  - Components: Patient CRUD       │  │
│  │  - State Management: Context/Redux│  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              │ HTTP Requests
              ▼
┌─────────────────────────────────────────┐
│      Express.js Backend (This API)      │
│  - Authentication (JWT)                  │
│  - Patient Management                    │
│  - Visit Tracking                        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         MongoDB Database                │
│  - Users Collection                     │
│  - Patients Collection                  │
│  - Visits Collection                    │
└─────────────────────────────────────────┘
```

## Support

For issues or questions:
1. Check the `README.md` for detailed documentation
2. Review `API_DOCUMENTATION.md` for endpoint details
3. Check server logs for error messages

