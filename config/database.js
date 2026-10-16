import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

// Supabase Transaction Pooler requires SSL + specific pool settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Supabase pooler
  },
  max: 3,                  // keep low for Vercel serverless (concurrent executions)
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

// Initialize database tables
const initializeDB = async () => {
  const client = await pool.connect();

  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(30) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'staff')),
        "resetPasswordToken" VARCHAR(255),
        "resetPasswordExpires" BIGINT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_resetToken ON users("resetPasswordToken");
    `);

    // Patients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
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

      CREATE INDEX IF NOT EXISTS idx_patients_idCard ON patients("idCard");
      CREATE INDEX IF NOT EXISTS idx_patients_createdAt ON patients("createdAt" DESC);
    `);

    // Visits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS visits (
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
        FOREIGN KEY ("createdBy") REFERENCES users(id),
        UNIQUE("patientId", "visitNumber")
      );

      CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits("patientId", "visitNumber");
      CREATE INDEX IF NOT EXISTS idx_visits_createdAt ON visits("createdAt" DESC);
    `);

    // updatedAt trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_users_timestamp ON users;
      CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_patients_timestamp ON patients;
      CREATE TRIGGER update_patients_timestamp BEFORE UPDATE ON patients
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_visits_timestamp ON visits;
      CREATE TRIGGER update_visits_timestamp BEFORE UPDATE ON visits
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('PostgreSQL tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL Connected via Supabase Pooler');
    client.release();
    await initializeDB();
    return pool;
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { pool };
