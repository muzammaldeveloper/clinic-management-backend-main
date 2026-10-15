import { pool } from '../config/database.js';

class Patient {
  constructor(data) {
    this.id = data.id;
    this.idCard = data.idCard;
    this.name = data.name;
    this.dateOfBirth = data.dateOfBirth || null;
    this.type = data.type || null;
    this.charges = data.charges || 0;
    this.visitCount = data.visitCount || 0;
    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    // Populated fields
    this.createdByUser = data.createdByUser;
  }

  // Create a new patient
  static async create(patientData) {
    const { idCard, name, dateOfBirth = null, type = null, charges = 0, createdBy, visitCount = 0 } = patientData;

    const result = await pool.query(
      `INSERT INTO patients ("idCard", name, "dateOfBirth", type, charges, "visitCount", "createdBy")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [idCard.toUpperCase(), name, dateOfBirth, type, charges, visitCount, createdBy]
    );

    return Patient.findById(result.rows[0].id);
  }

  // Find patient by ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT p.*, u.username as "createdByUsername", u.email as "createdByEmail"
       FROM patients p
       LEFT JOIN users u ON p."createdBy" = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    const patient = new Patient(row);
    if (row.createdByUsername) {
      patient.createdByUser = {
        username: row.createdByUsername,
        email: row.createdByEmail
      };
    }
    return patient;
  }

  // Find patient by ID card
  static async findByIdCard(idCard) {
    const result = await pool.query(
      'SELECT * FROM patients WHERE "idCard" = $1',
      [idCard.toUpperCase()]
    );
    return result.rows[0] ? new Patient(result.rows[0]) : null;
  }

  // Find all patients with pagination and search
  static async findAll(options = {}) {
    const { page = 1, limit = 10, search = '' } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username as "createdByUsername", u.email as "createdByEmail"
      FROM patients p
      LEFT JOIN users u ON p."createdBy" = u.id
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` WHERE p."idCard" ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex}`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern);
      paramIndex++;
    }

    query += ` ORDER BY p."createdAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const patients = result.rows.map(row => {
      const patient = new Patient(row);
      if (row.createdByUsername) {
        patient.createdByUser = {
          username: row.createdByUsername,
          email: row.createdByEmail
        };
      }
      return patient;
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM patients';
    const countParams = [];
    if (search) {
      countQuery += ' WHERE "idCard" ILIKE $1 OR name ILIKE $1';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return {
      patients,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  // Update patient
  async update(updates) {
    const { name, dateOfBirth, type, charges } = updates;
    const updatesList = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updatesList.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (dateOfBirth !== undefined) {
      updatesList.push(`"dateOfBirth" = $${paramIndex++}`);
      params.push(dateOfBirth);
    }
    if (type !== undefined) {
      updatesList.push(`type = $${paramIndex++}`);
      params.push(type);
    }
    if (charges !== undefined) {
      updatesList.push(`charges = $${paramIndex++}`);
      params.push(charges);
    }

    if (updatesList.length === 0) {
      return this;
    }

    params.push(this.id);
    await pool.query(
      `UPDATE patients SET ${updatesList.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    return Patient.findById(this.id);
  }

  // Save patient (for visitCount updates)
  async save() {
    await pool.query(
      `UPDATE patients 
       SET "visitCount" = $1, "isActive" = $2
       WHERE id = $3`,
      [this.visitCount, this.isActive, this.id]
    );
    return Patient.findById(this.id);
  }

  // Delete patient
  static async deleteById(id) {
    await pool.query('DELETE FROM patients WHERE id = $1', [id]);
  }

  // Convert to JSON
  toJSON() {
    const json = { ...this };
    if (json.createdByUser) {
      json.createdBy = json.createdByUser;
    }
    delete json.createdByUser;
    return json;
  }
}

export default Patient;
