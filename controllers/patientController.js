import { validationResult } from 'express-validator';
import Patient from '../models/Patient.js';
import Visit from '../models/Visit.js';

const FREE_VISIT_LIMIT = 2;

// Bulk import patients
export const bulkImportPatients = async (req, res) => {
  try {
    const { patients } = req.body;

    if (!Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({ 
        message: 'Request body must contain a "patients" array with at least one patient' 
      });
    }

    const results = {
      success: [],
      failed: [],
      total: patients.length,
      successCount: 0,
      failedCount: 0
    };

    for (let i = 0; i < patients.length; i++) {
      const patientData = patients[i];
      
      try {
        // Validate required fields
        if (!patientData.idCard || typeof patientData.idCard !== 'string' || !patientData.idCard.trim()) {
          throw new Error('idCard is required and must be a non-empty string');
        }
        
        if (!patientData.name || typeof patientData.name !== 'string' || !patientData.name.trim()) {
          throw new Error('name is required and must be a non-empty string');
        }

        const idCard = patientData.idCard.trim();
        const name = patientData.name.trim();

        // Validate name length
        if (name.length < 2 || name.length > 100) {
          throw new Error('name must be between 2 and 100 characters');
        }

        // Validate idCard length
        if (idCard.length < 1 || idCard.length > 50) {
          throw new Error('idCard must be between 1 and 50 characters');
        }

        // Check if patient already exists
        const existingPatient = await Patient.findByIdCard(idCard);
        if (existingPatient) {
          throw new Error(`Patient with ID card ${idCard} already exists`);
        }

        // Parse and validate dateOfBirth
        let dateOfBirth = null;
        if (patientData.dateOfBirth && String(patientData.dateOfBirth).trim()) {
          dateOfBirth = String(patientData.dateOfBirth).trim();
        }

        // Parse and validate type
        let type = null;
        if (patientData.type && String(patientData.type).trim()) {
          const typeValue = String(patientData.type).trim().toLowerCase();
          if (!['child', 'man', 'woman'].includes(typeValue)) {
            throw new Error('type must be one of: child, man, woman');
          }
          type = typeValue;
        }

        // Parse and validate charges
        let charges = 0;
        if (patientData.charges !== undefined && patientData.charges !== null && patientData.charges !== '') {
          charges = Number(patientData.charges);
          if (isNaN(charges) || charges < 0) {
            throw new Error('charges must be a non-negative number');
          }
        }

        // Parse and validate visitCount
        let visitCount = 0;
        if (patientData.visitCount !== undefined && patientData.visitCount !== null && patientData.visitCount !== '') {
          visitCount = Number(patientData.visitCount);
          if (isNaN(visitCount) || visitCount < 0 || !Number.isInteger(visitCount)) {
            throw new Error('visitCount must be a non-negative integer');
          }
        }

        // Create patient
        const patient = await Patient.create({
          idCard,
          name,
          dateOfBirth,
          type,
          charges,
          visitCount,
          createdBy: req.user.id
        });

        results.success.push({
          index: i,
          idCard: patient.idCard,
          name: patient.name,
          id: patient.id
        });
        results.successCount++;

      } catch (error) {
        results.failed.push({
          index: i,
          idCard: patientData.idCard || 'N/A',
          name: patientData.name || 'N/A',
          error: error.message
        });
        results.failedCount++;
      }
    }

    const statusCode = results.successCount > 0 ? 201 : 400;
    
    res.status(statusCode).json({
      message: `Import completed: ${results.successCount} succeeded, ${results.failedCount} failed`,
      results
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Server error during bulk import', error: error.message });
  }
};

// Create a new patient
export const createPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { idCard, name, dateOfBirth, type, charges, visitCount } = req.body;

    // Check if patient with this ID card already exists
    const existingPatient = await Patient.findByIdCard(idCard);
    if (existingPatient) {
      return res.status(400).json({ message: 'Patient with this ID card already exists' });
    }

    // Use N/A as name — this system only tracks CNIC
    const patientName = (name && name.trim() && name.trim() !== idCard.trim())
      ? name.trim()
      : 'N/A';

    // Normalise visitCount (used mainly for imports; defaults to 0)
    const initialVisitCount =
      visitCount !== undefined && visitCount !== null && !isNaN(Number(visitCount))
        ? Number(visitCount)
        : 0;

    const patient = await Patient.create({
      idCard,
      name: patientName,
      dateOfBirth: dateOfBirth || null,
      type: type || null,
      charges: charges || 0,
      visitCount: 1,           // first visit recorded on creation
      createdBy: req.user.id
    });

    // Automatically record Visit #1 when patient is created
    await Visit.create({
      patientId: patient.id,
      visitNumber: 1,
      isFreeVisit: true,
      charges: 0,
      paid: true,
      notes: 'First visit — recorded on registration',
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Patient created successfully',
      patient: patient.toJSON()
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all patients
export const getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const result = await Patient.findAll({ page, limit, search });

    res.json({
      patients: result.patients.map(p => p.toJSON()),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error) {
    console.error('Get all patients error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get all patient visits
    const allVisits = await Visit.findByPatientId(patient.id, 'visitNumber', 'DESC');
    
    // Get current month's visits
    const currentMonthVisits = await Visit.findCurrentMonthVisits(patient.id);
    const monthlyVisitCount = currentMonthVisits.length;

    res.json({
      patient: patient.toJSON(),
      visits: allVisits.map(v => v.toJSON()),
      currentMonthVisits: currentMonthVisits.map(v => v.toJSON()),
      monthlyVisitCount,
      remainingFreeVisitsThisMonth: Math.max(0, FREE_VISIT_LIMIT - monthlyVisitCount)
    });
  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update patient CNIC
export const updatePatientCnic = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { idCard } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if new CNIC is already taken by another patient
    const existing = await Patient.findByIdCard(idCard);
    if (existing && existing.id !== patient.id) {
      return res.status(400).json({ message: 'A patient with this CNIC already exists' });
    }

    const updatedPatient = await patient.update({ idCard });

    res.json({
      message: 'CNIC updated successfully',
      patient: updatedPatient.toJSON(),
    });
  } catch (error) {
    console.error('Update CNIC error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update patient
export const updatePatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, dateOfBirth, type, charges } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (type !== undefined) updates.type = type;
    if (charges !== undefined) updates.charges = charges;

    const updatedPatient = await patient.update(updates);

    res.json({
      message: 'Patient updated successfully',
      patient: updatedPatient.toJSON()
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete patient
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Delete all visits associated with this patient (handled by foreign key cascade)
    await Visit.deleteByPatientId(patient.id);

    // Delete patient
    await Patient.deleteById(patient.id);

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Record a visit for a patient
export const recordVisit = async (req, res) => {
  try {
    const { notes, charges } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get current month's visit count (monthly reset logic)
    const currentMonthVisitCount = await Visit.countCurrentMonthVisits(patient.id);

    // Enforce maximum 2 visits per month
    if (currentMonthVisitCount >= FREE_VISIT_LIMIT) {
      return res.status(400).json({
        message: `Visit limit reached. This patient has already used all ${FREE_VISIT_LIMIT} allowed visits this month.`,
        limitReached: true,
        currentMonthVisitCount,
        limit: FREE_VISIT_LIMIT,
      });
    }

    const monthlyVisitNumber = currentMonthVisitCount + 1;

    // Increment total visit count
    patient.visitCount += 1;
    const totalVisitNumber = patient.visitCount;

    // All visits within limit are free visits
    const isFreeVisit = true;
    const visitCharges = 0;

    // Create visit record
    const visit = await Visit.create({
      patientId: patient.id,
      visitNumber: totalVisitNumber,
      isFreeVisit,
      charges: visitCharges,
      paid: isFreeVisit ? true : false, // Free visits are considered paid
      notes: notes || '',
      createdBy: req.user.id
    });

    // Save updated patient
    await patient.save();

    res.status(201).json({
      message: 'Visit recorded successfully',
      visit: visit.toJSON(),
      patient: {
        visitCount: patient.visitCount,
        monthlyVisitCount: monthlyVisitNumber,
        remainingFreeVisitsThisMonth: Math.max(0, FREE_VISIT_LIMIT - monthlyVisitNumber)
      }
    });
  } catch (error) {
    console.error('Record visit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark visit as paid
export const markVisitPaid = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.visitId);

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    if (visit.paid) {
      return res.status(400).json({ message: 'Visit is already marked as paid' });
    }

    visit.paid = true;
    const updatedVisit = await visit.save();

    res.json({
      message: 'Visit marked as paid',
      visit: updatedVisit.toJSON()
    });
  } catch (error) {
    console.error('Mark visit paid error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get patient visits
export const getPatientVisits = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const allVisits = await Visit.findByPatientId(patient.id, 'visitNumber', 'DESC');
    const currentMonthVisits = await Visit.findCurrentMonthVisits(patient.id);
    const monthlyVisitCount = currentMonthVisits.length;

    res.json({
      visits: allVisits.map(v => v.toJSON()),
      currentMonthVisits: currentMonthVisits.map(v => v.toJSON()),
      patient: {
        visitCount: patient.visitCount,
        monthlyVisitCount,
        remainingFreeVisitsThisMonth: Math.max(0, FREE_VISIT_LIMIT - monthlyVisitCount)
      }
    });
  } catch (error) {
    console.error('Get patient visits error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clean up old visit records (older than specified months)
export const cleanupOldVisits = async (req, res) => {
  try {
    // Get months parameter from query (default: 1 month)
    const monthsOld = parseInt(req.query.months) || 1;

    if (monthsOld < 1) {
      return res.status(400).json({ message: 'months parameter must be at least 1' });
    }

    // Delete old visits
    const deletedCount = await Visit.deleteOldVisits(monthsOld);

    res.json({
      message: `Successfully cleaned up old visit records`,
      deletedCount,
      olderThan: `${monthsOld} month(s)`
    });
  } catch (error) {
    console.error('Cleanup old visits error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
