type EmployeeSyncInput = {
	tenantId: string;
	employeeId: string;
	tasksCompleted: number;
	attendanceDays: number;
	idleHours: number;
	workingHours: number;
	taskProgress: number;
	daysLeft: number;
	lateArrivals: number;
	absentDays: number;
};

type TaskSyncInput = {
	tenantId: string;
	employeeId: string;
	taskId: string;
	progressPercent: number;
	daysLeft: number;
};

type ReportSyncInput = EmployeeSyncInput & {
	history: Array<{
		date: string;
		productivityScore: number;
		workingHours: number;
		idleHours: number;
	}>;
};

export function mapEmployeeInputToAiPayload(input: EmployeeSyncInput) {
	return {
		tenant_id: input.tenantId,
		employee_id: input.employeeId,
		tasks_completed: input.tasksCompleted,
		attendance_days: input.attendanceDays,
		idle_hours: input.idleHours,
		working_hours: input.workingHours,
		task_progress: input.taskProgress,
		days_left: input.daysLeft,
		late_arrivals: input.lateArrivals,
		absent_days: input.absentDays,
	};
}

export function mapTaskInputToAiPayload(input: TaskSyncInput) {
	return {
		tenant_id: input.tenantId,
		employee_id: input.employeeId,
		task_id: input.taskId,
		progress_percent: input.progressPercent,
		days_left: input.daysLeft,
	};
}

export function mapReportInputToAiPayload(input: ReportSyncInput) {
	return {
		...mapEmployeeInputToAiPayload(input),
		history: input.history.map((point) => ({
			date: point.date,
			productivity_score: point.productivityScore,
			working_hours: point.workingHours,
			idle_hours: point.idleHours,
		})),
	};
}
