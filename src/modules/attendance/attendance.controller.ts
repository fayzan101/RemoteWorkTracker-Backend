import { Request, Response } from 'express';
import { getAllAttendance, getAttendanceById, getAttendanceByUserId, removeAttendanceById, patchAttendanceById } from './attendance.service';
import { attendanceIdParamSchema, attendancePatchSchema } from './attendance.validation';
import { success, error } from '../../utils/response';
export async function getAttendanceController(req: Request, res: Response) {
	try {
		const records = await getAllAttendance();
		return success(res, records, 'Attendance records fetched');
	} catch (err) {
		return error(res, 'Failed to fetch attendance records', 500, err);
	}
}
export async function getAttendanceByIdController(req: Request, res: Response) {
	try {
		let { id } = req.params;
		if (Array.isArray(id)) id = id[0];
		const parseResult = attendanceIdParamSchema.safeParse({ id });
		if (!parseResult.success) {
			return error(res, parseResult.error.issues[0]?.message || 'Invalid attendance ID', 400);
		}
		const record = await getAttendanceById(id);
		if (!record) return error(res, 'Attendance record not found', 404);
		return success(res, record, 'Attendance record fetched');
	} catch (err) {
		return error(res, 'Failed to fetch attendance record', 500, err);
	}
}
export async function getMyAttendanceController(req: Request, res: Response) {
	try {
		const user = (req as any).user;
		if (!user || !user.userId) return error(res, 'Unauthorized', 401);
		const records = await getAttendanceByUserId(user.userId);
		return success(res, records, 'Your attendance records fetched');
	} catch (err) {
		return error(res, 'Failed to fetch your attendance records', 500, err);
	}
}

export async function deleteAttendanceByIdController(req: Request, res: Response) {
	try {
		let { id } = req.params;
		if (Array.isArray(id)) id = id[0];
		const parseResult = attendanceIdParamSchema.safeParse({ id });
		if (!parseResult.success) {
			return error(res, parseResult.error.issues[0]?.message || 'Invalid attendance ID', 400);
		}
		const deleted = await removeAttendanceById(id);
		if (!deleted) return error(res, 'Attendance record not found', 404);
		return success(res, deleted, 'Attendance record deleted');
	} catch (err) {
		return error(res, 'Failed to delete attendance record', 500, err);
	}
}

export async function patchAttendanceByIdController(req: Request, res: Response) {
	try {
		let { id } = req.params;
		if (Array.isArray(id)) id = id[0];
		const paramResult = attendanceIdParamSchema.safeParse({ id });
		if (!paramResult.success) {
			return error(res, paramResult.error.issues[0]?.message || 'Invalid attendance ID', 400);
		}
		const bodyResult = attendancePatchSchema.safeParse(req.body);
		if (!bodyResult.success) {
			return error(res, bodyResult.error.issues[0]?.message || 'Invalid data', 400, bodyResult.error.issues);
		}
		const updated = await patchAttendanceById(id, bodyResult.data);
		if (!updated) return error(res, 'Attendance record not found or not updated', 404);
		return success(res, updated, 'Attendance record updated');
	} catch (err) {
		return error(res, 'Failed to update attendance record', 500, err);
	}
}