import { pool } from '../config/database.js';

class Visit {
  constructor(data) {
    this.id = data.id;
    this.patientId = data.patientId || data.patient;
    this.visitNumber = data.visitNumber;
    this.isFreeVisit = data.isFreeVisit !== undefined ? Boolean(data.isFreeVisit) : true;
    this.charges = data.charges || 0;
    this.paid = data.paid !== undefined ? Boolean(data.paid) : false;
    this.notes = data.notes || '';
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    // Populated fields
    this.createdByUser = data.createdByUser;
  }

  // Create a new visit
  static async create(visitData) {
    const { patientId, visitNumber, isFreeVisit = true, charges = 0, paid = false, notes = '', createdBy } = visitData;

    const result = await pool.query(
      `INSERT INTO visits ("patientId", "visitNumber", "isFreeVisit", charges, paid, notes, "createdBy")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patientId, visitNumber, isFreeVisit, charges, paid, notes, createdBy]
    );

    return Visit.findById(result.rows[0].id);
  }

  // Find visit by ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT v.*, u.username as "createdByUsername"
       FROM visits v
       LEFT JOIN users u ON v."createdBy" = u.id
       WHERE v.id = $1`,
      [id]
    );

    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    const visit = new Visit(row);
    if (row.createdByUsername) {
      visit.createdByUser = {
        username: row.createdByUsername
      };
    }
    return visit;
  }

  // Find visits by patient ID
  static async findByPatientId(patientId, sortBy = 'visitNumber', order = 'ASC') {
    const validSortBy = ['visitNumber', 'createdAt'];
    const validOrder = ['ASC', 'DESC'];
    const sortColumn = validSortBy.includes(sortBy) ? `"${sortBy}"` : '"visitNumber"';
    const sortOrder = validOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

    const result = await pool.query(
      `SELECT v.*, u.username as "createdByUsername"
       FROM visits v
       LEFT JOIN users u ON v."createdBy" = u.id
       WHERE v."patientId" = $1
       ORDER BY v.${sortColumn} ${sortOrder}`,
      [patientId]
    );

    return result.rows.map(row => {
      const visit = new Visit(row);
      if (row.createdByUsername) {
        visit.createdByUser = {
          username: row.createdByUsername
        };
      }
      return visit;
    });
  }

  // Update visit
  async update(updates) {
    const { paid, charges, notes } = updates;
    const updatesList = [];
    const params = [];
    let paramIndex = 1;

    if (paid !== undefined) {
      updatesList.push(`paid = $${paramIndex++}`);
      params.push(paid);
    }
    if (charges !== undefined) {
      updatesList.push(`charges = $${paramIndex++}`);
      params.push(charges);
    }
    if (notes !== undefined) {
      updatesList.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }

    if (updatesList.length === 0) {
      return this;
    }

    params.push(this.id);
    await pool.query(
      `UPDATE visits SET ${updatesList.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    return Visit.findById(this.id);
  }

  // Save visit
  async save() {
    await pool.query(
      `UPDATE visits 
       SET paid = $1, charges = $2, notes = $3
       WHERE id = $4`,
      [this.paid, this.charges, this.notes, this.id]
    );
    return Visit.findById(this.id);
  }

  // Delete visits by patient ID
  static async deleteByPatientId(patientId) {
    await pool.query('DELETE FROM visits WHERE "patientId" = $1', [patientId]);
  }

  // Get count of visits for current month
  static async countCurrentMonthVisits(patientId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM visits 
       WHERE "patientId" = $1 
       AND "createdAt" >= $2
       AND "createdAt" < $3`,
      [patientId, startOfMonth, startOfNextMonth]
    );
    
    return result.rows[0] ? parseInt(result.rows[0].count) : 0;
  }

  // Get visits for current month
  static async findCurrentMonthVisits(patientId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const result = await pool.query(
      `SELECT v.*, u.username as "createdByUsername"
       FROM visits v
       LEFT JOIN users u ON v."createdBy" = u.id
       WHERE v."patientId" = $1 
       AND v."createdAt" >= $2
       AND v."createdAt" < $3
       ORDER BY v."createdAt" ASC`,
      [patientId, startOfMonth, startOfNextMonth]
    );
    
    return result.rows.map(row => {
      const visit = new Visit(row);
      if (row.createdByUsername) {
        visit.createdByUser = {
          username: row.createdByUsername
        };
      }
      return visit;
    });
  }

  // Delete visits older than specified months
  static async deleteOldVisits(monthsOld = 1) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
    
    const result = await pool.query(
      'DELETE FROM visits WHERE "createdAt" < $1',
      [cutoffDate]
    );
    
    return result.rowCount;
  }

  // Convert to JSON
  toJSON() {
    const json = { ...this };
    if (json.createdByUser) {
      json.createdBy = json.createdByUser;
    }
    delete json.createdByUser;
    // Map patientId to patient for consistency with Mongoose version
    json.patient = json.patientId;
    return json;
  }
}

export default Visit;
