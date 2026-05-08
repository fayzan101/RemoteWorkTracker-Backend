import { Pool } from 'pg';
import { ENV } from './env';
const pool = new Pool({
	connectionString: ENV.DATABASE_URL,
});
export const getDb = () => {
	return {
		insert: async (table: string, data: Record<string, any>) => {
			const keys = Object.keys(data);
			const values = Object.values(data);
			const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
			const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
			await pool.query(query, values);
		},
		findOne: async (table: string, where: Record<string, any>) => {
			const keys = Object.keys(where);
			const values = Object.values(where);
			const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
			const query = `SELECT * FROM ${table} WHERE ${conditions} LIMIT 1`;
			const result = await pool.query(query, values);
			return result.rows[0] || null;
		},
		selectAll: async (table: string) => {
			const query = `SELECT * FROM ${table}`;
			const result = await pool.query(query);
			return result.rows;
		},
	};
};
export default pool;