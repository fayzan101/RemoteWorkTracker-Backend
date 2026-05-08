export const deleteUserByIdRepo = async (userId: string) => {
  const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [userId]);
  return result.rows[0] || null;
};
export const getAllUsersRepo = async () => {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
};
import { getDb } from '../../config/db';
export const registerUserRepo = async (user: any) => {
  const db = getDb();
  await db.insert('users', user);
  return user.userId;
};
import pool from '../../config/db';

export const findOrganizationById = async (organizationId: string) => {
  const result = await pool.query('SELECT * FROM organizations WHERE organization_id = $1', [organizationId]);
  return result.rows[0] || null;
};
export const updateOrganizationAdminPassword = async (organizationId: string, newPasswordHash: string) => {
  const adminUser = await pool.query(
    'SELECT user_id FROM users WHERE organization_id = $1 AND name = $2',
    [organizationId, 'Admin']
  );
  if (!adminUser.rows[0]) throw new Error('Admin user not found for this organization');
  await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [newPasswordHash, adminUser.rows[0].user_id]);
  return true;
};
