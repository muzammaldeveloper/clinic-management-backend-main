# PostgreSQL Migration Guide

The Clinic Management System has been successfully migrated from SQLite to PostgreSQL!

## ✅ What Changed

### 1. **Database Driver**
- **Before:** `better-sqlite3` (SQLite)
- **After:** `pg` (PostgreSQL)

### 2. **Database Configuration** (`config/database.js`)
- Now uses PostgreSQL connection pool
- Supports environment variables for configuration
- Automatic table initialization on startup

### 3. **All Models Updated**
- `User.js` - All methods now use async/await with PostgreSQL queries
- `Patient.js` - Converted to use parameterized queries ($1, $2, etc.)
- `Visit.js` - Updated to use PostgreSQL date/time functions

### 4. **Controllers Updated**
- Added `await` to all database operations
- All async operations properly handled

### 5. **Schema Changes**
- `SERIAL` instead of `AUTOINCREMENT` for primary keys
- `BOOLEAN` instead of `INTEGER` for boolean fields
- `DECIMAL(10,2)` for currency values
- `TIMESTAMP` instead of `DATETIME`
- `VARCHAR` with length constraints

## 🚀 Setup Instructions

### 1. Install PostgreSQL
Make sure PostgreSQL is installed and running on your system.

**Download:** https://www.postgresql.org/download/

### 2. Install Dependencies
```bash
npm install
```

The `pg` package is already in `package.json`, so this will install it.

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=furqan

# JWT Secret
JWT_SECRET=ClinicManagementSystem
```

### 4. Database will be automatically created
When you start the server, the database tables will be created automatically:
- `users` table
- `patients` table
- `visits` table

### 5. Start the Server
```bash
npm start
# or for development
npm run dev
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  "resetPasswordToken" VARCHAR(255),
  "resetPasswordExpires" BIGINT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Patients Table
```sql
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  "idCard" VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  "dateOfBirth" DATE,
  type VARCHAR(10) CHECK(type IN ('child', 'man', 'woman')),
  charges DECIMAL(10, 2) DEFAULT 0,
  "visitCount" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("createdBy") REFERENCES users(id)
);
```

### Visits Table
```sql
CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  "patientId" INTEGER NOT NULL,
  "visitNumber" INTEGER NOT NULL,
  "isFreeVisit" BOOLEAN DEFAULT TRUE,
  charges DECIMAL(10, 2) DEFAULT 0,
  paid BOOLEAN DEFAULT FALSE,
  notes TEXT,
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("patientId") REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES users(id)
);
```

## 🔄 Migrating Existing Data (Optional)

If you had data in SQLite and want to migrate it to PostgreSQL:

1. Export data from SQLite
2. Transform the data format if needed
3. Import into PostgreSQL using SQL INSERT statements or a migration script

## ✅ Benefits of PostgreSQL

1. **Better Performance** - Handles concurrent connections better
2. **Advanced Features** - Full ACID compliance, better query optimization
3. **Scalability** - Can handle larger datasets
4. **Production Ready** - Industry standard for production applications
5. **Better Data Types** - Native support for JSON, arrays, timestamps, etc.

## 🎯 Testing the Connection

After starting the server, you should see:
```
PostgreSQL Connected: localhost:5432/postgres
PostgreSQL tables initialized successfully
Server is running on port 5000
```

Test the API:
```bash
curl http://localhost:5000/
```

You should get:
```json
{
  "message": "Clinic Management System API",
  "version": "1.0.0",
  "database": "PostgreSQL",
  "endpoints": {
    "auth": "/api/auth",
    "patients": "/api/patients"
  }
}
```

## 📝 Notes

- All existing API endpoints work exactly the same
- No changes needed in your frontend
- Database connection pool automatically manages connections
- Automatic reconnection if connection is lost
- All queries use parameterized statements (SQL injection protected)

## 🐛 Troubleshooting

### Connection Error
If you see `Connection error`, check:
1. PostgreSQL is running
2. Credentials in `.env` are correct
3. Database exists (default: `postgres`)
4. Port 5432 is not blocked by firewall

### Permission Errors
Make sure your PostgreSQL user has CREATE TABLE permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
```

## 🎉 Success!

Your Clinic Management System now runs on PostgreSQL! All features remain the same, but you now have a more robust and scalable database system.

