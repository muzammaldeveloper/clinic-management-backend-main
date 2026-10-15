# 🏥 Clinic Management System

A modern, full-stack clinic management application with patient tracking, visit management, and administrative capabilities.

## 🔐 Authentication & Authorization
- Secure JWT-based authentication with Flask-JWT-Extended
- Role-based access control (Admin/Staff/Doctor)
- Protected API routes with token validation
- Secure password hashing with bcrypt

## 👨‍⚕️ Patient Management
- Complete patient records with demographics and medical history
- Search and filter patients by name, contact, or medical conditions
- Patient profile with visit history and treatment plans
- Emergency contact information storage

## 📊 Visit Tracking System
- Automatic visit counting with monthly limits
- 3 free visits per month per patient policy
- Visit history with detailed notes and prescriptions
- Real-time visit statistics and analytics

## 📱 Admin Dashboard
- Comprehensive dashboard with key metrics
- Data import/export functionality (CSV, Excel)
- Bulk operations for patient management
- User management and role assignment

## 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Dark/light mode support
- Real-time notifications
- Interactive charts and data visualization
- Form validation with user-friendly error messages

## 🛠️ Tech Stack

### Frontend (Next.js 14)
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Axios for HTTP requests

### Backend (Flask)
- Flask Python web framework
- Flask-JWT-Extended for authentication
- Flask-SQLAlchemy for ORM
- Flask-CORS for cross-origin requests
- Flask-Bcrypt for password hashing

### Database
- SQLite (Development)
- PostgreSQL (Production)
- MySQL (Alternative)

### Deployment
- Vercel for frontend hosting
- Render/Railway for backend hosting
