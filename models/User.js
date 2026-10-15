import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../config/database.js';

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'staff';
    this.resetPasswordToken = data.resetPasswordToken;
    this.resetPasswordExpires = data.resetPasswordExpires;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Hash password before saving
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Create a new user
  static async create(userData) {
    const { username, email, password, role = 'staff' } = userData;
    
    // Hash password
    const hashedPassword = await User.hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [username, email, hashedPassword, role]
    );

    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Find user by username
  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Find user by email or username
  static async findByEmailOrUsername(email, username) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Convert to JSON (exclude password)
  toJSON() {
    const { password, ...user } = this;
    return user;
  }

  // Get user without password
  static async findByIdWithoutPassword(id) {
    const result = await pool.query(
      'SELECT id, username, email, role, "createdAt", "updatedAt" FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Generate password reset token
  async generatePasswordResetToken() {
    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving to database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiry (1 hour from now)
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    
    // Save to database
    await pool.query(
      `UPDATE users 
       SET "resetPasswordToken" = $1, "resetPasswordExpires" = $2
       WHERE id = $3`,
      [hashedToken, expires, this.id]
    );
    
    // Return unhashed token (to send in email)
    return resetToken;
  }

  // Find user by reset token
  static async findByResetToken(token) {
    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE "resetPasswordToken" = $1 
       AND "resetPasswordExpires" > $2`,
      [hashedToken, Date.now()]
    );
    
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Reset password with new password
  async resetPassword(newPassword) {
    const hashedPassword = await User.hashPassword(newPassword);
    
    await pool.query(
      `UPDATE users 
       SET password = $1, "resetPasswordToken" = NULL, "resetPasswordExpires" = NULL
       WHERE id = $2`,
      [hashedPassword, this.id]
    );
    
    return User.findById(this.id);
  }

  // Clear reset token
  async clearResetToken() {
    await pool.query(
      `UPDATE users 
       SET "resetPasswordToken" = NULL, "resetPasswordExpires" = NULL
       WHERE id = $1`,
      [this.id]
    );
  }
}

export default User;
