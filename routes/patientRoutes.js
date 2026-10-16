import express from 'express';
import { body, param } from 'express-validator';
import {
  createPatient,
  bulkImportPatients,
  getAllPatients,
  getPatientById,
  updatePatient,
  updatePatientCnic,
  deletePatient,
  recordVisit,
  markVisitPaid,
  getPatientVisits,
  cleanupOldVisits
} from '../controllers/patientController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createPatientValidation = [
  body('idCard')
    .trim()
    .notEmpty()
    .withMessage('ID Card is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('ID Card must be between 1 and 50 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('dateOfBirth')
    .optional()
    .trim()
    .isISO8601()
    .withMessage('Date of Birth must be a valid date (YYYY-MM-DD)'),
  body('type')
    .optional()
    .trim()
    .isIn(['child', 'man', 'woman'])
    .withMessage('Type must be one of: child, man, woman'),
  body('charges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Charges must be a positive number'),
  body('visitCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('visitCount must be a non-negative integer')
];

const updatePatientValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('dateOfBirth')
    .optional()
    .trim()
    .isISO8601()
    .withMessage('Date of Birth must be a valid date (YYYY-MM-DD)'),
  body('type')
    .optional()
    .trim()
    .isIn(['child', 'man', 'woman'])
    .withMessage('Type must be one of: child, man, woman'),
  body('charges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Charges must be a positive number')
];

const recordVisitValidation = [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('charges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Charges must be a positive number')
];

const bulkImportValidation = [
  body('patients')
    .isArray({ min: 1 })
    .withMessage('patients must be an array with at least one patient')
];

// Routes
router.post('/import', bulkImportValidation, bulkImportPatients);
router.post('/', createPatientValidation, createPatient);
router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.put('/:id', updatePatientValidation, updatePatient);
router.patch('/:id/cnic', [
  body('idCard')
    .trim()
    .notEmpty().withMessage('CNIC is required')
    .isLength({ min: 1, max: 50 }).withMessage('CNIC must be between 1 and 50 characters'),
], updatePatientCnic);
router.delete('/:id', deletePatient);

// Visit routes
router.post('/:id/visits', recordVisitValidation, recordVisit);
router.get('/:id/visits', getPatientVisits);
router.patch('/visits/:visitId/paid', markVisitPaid);

// Cleanup route (for maintenance)
router.delete('/visits/cleanup', cleanupOldVisits);

export default router;

