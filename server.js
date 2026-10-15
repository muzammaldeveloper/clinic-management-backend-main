import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check — Vercel / uptime monitors use this
app.get('/', (req, res) => {
  res.json({
    message: 'Clinic Management System API',
    version: '1.0.0',
    status: 'healthy',
    database: 'PostgreSQL',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);

// 404 handler — must be before error handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — prevents unhandled crashes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Connect to PostgreSQL and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  });
