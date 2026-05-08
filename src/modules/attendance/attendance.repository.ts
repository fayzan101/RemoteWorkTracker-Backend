import { getDb } from '../../config/db';
import dbPool from '../../config/db';
export async function deleteAttendanceById(attendanceId: string) {
	const query = 'DELETE FROM attendance WHERE attendance_id = $1 RETURNING *';
	const result = await dbPool.query(query, [attendanceId]);
	return result.rows[0] || null;
}
export async function updateAttendanceById(attendanceId: string, data: Record<string, any>) {
	const keys = Object.keys(data);
	if (keys.length === 0) return null;
	const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
	const values = [attendanceId, ...Object.values(data)];
	const query = `UPDATE attendance SET ${setClause} WHERE attendance_id = $1 RETURNING *`;
	const result = await dbPool.query(query, values);
	return result.rows[0] || null;
}
export async function findAllAttendance() {
	const db = getDb();
	return db.selectAll('attendance');
}
export async function findAttendanceById(attendanceId: string) {
	const db = getDb();
	return db.findOne('attendance', { attendance_id: attendanceId });
}
export async function findAttendanceByUserId(userId: string) {
	const query = `SELECT * FROM attendance WHERE user_id = $1 ORDER BY created_at DESC`;
	const result = await dbPool.query(query, [userId]);
	return result.rows;
}

export async function getAiEmployeeSnapshotFromAttendance(userId: string) {
	const userResult = await dbPool.query(
		`SELECT user_id, organization_id
		 FROM users
		 WHERE user_id = $1
		 LIMIT 1`,
		[userId]
	);
	const userRow = userResult.rows[0];
	if (!userRow) return null;

	const attendanceRowsResult = await dbPool.query(
		`SELECT check_in, check_out
		 FROM attendance
		 WHERE user_id = $1
		   AND check_in >= NOW() - INTERVAL '30 days'
		 ORDER BY check_in DESC`,
		[userId]
	);
	const attendanceRows = attendanceRowsResult.rows as Array<{ check_in: string; check_out: string | null }>;

	const attendanceDays = new Set(
		attendanceRows.map((row) => new Date(row.check_in).toISOString().slice(0, 10))
	).size;

	let workingHours = 0;
	let lateArrivals = 0;
	for (const row of attendanceRows.slice(0, 14)) {
		const checkIn = new Date(row.check_in);
		const checkOut = row.check_out ? new Date(row.check_out) : null;
		if (checkOut && checkOut > checkIn) {
			workingHours += (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
		}
		if (checkIn.getUTCHours() >= 10) {
			lateArrivals += 1;
		}
	}
	workingHours = Number(workingHours.toFixed(2));

	const taskAggResult = await dbPool.query(
		`SELECT
		   COUNT(*)::int AS total_tasks,
		   COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) IN ('done', 'completed', 'closed'))::int AS completed_tasks,
		   COALESCE(AVG(
		     CASE
		       WHEN LOWER(COALESCE(status, '')) IN ('done', 'completed', 'closed') THEN 100
		       WHEN LOWER(COALESCE(status, '')) IN ('in_progress', 'in progress', 'active') THEN 50
		       ELSE 0
		     END
		   ), 0)::float AS avg_progress
		 FROM tasks
		 WHERE assigned_to = $1`,
		[userId]
	);
	const taskAgg = taskAggResult.rows[0] as {
		total_tasks: number;
		completed_tasks: number;
		avg_progress: number;
	};

	return {
		tenantId: String(userRow.organization_id),
		employeeId: String(userRow.user_id),
		tasksCompleted: Number(taskAgg?.completed_tasks || 0),
		attendanceDays,
		idleHours: 0,
		workingHours,
		taskProgress: Number((taskAgg?.avg_progress || 0).toFixed(2)),
		daysLeft: 0,
		lateArrivals,
		absentDays: Math.max(0, 30 - attendanceDays),
	};
}
