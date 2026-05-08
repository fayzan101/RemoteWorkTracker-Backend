import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rolesRouter from "./modules/roles/role.routes";
import organizationRouter from "./modules/organizations/organization.routes";
import departmentRouter from "./modules/departments/department.routes";
import projectRouter from "./modules/projects/project.routes";
import tasksRouter from "./modules/tasks/tasks.routes";
import notificationRouter from "./modules/notifications/notification.routes";
import goalRouter from "./modules/goals/goal.routes";
import learningRouter from "./modules/learning/learning.routes";
import userRouter from "./modules/users/user.routes";
import wellnessRouter from "./modules/wellness/wellness.routes";
import agentRouter from "./modules/agent/agent.routes";
import payrollRouter from "./modules/payroll/payroll.routes";
import attendanceRouter from "./modules/attendance/attendance.routes";
import aiRouter from "./modules/ai/ai.routes";
import { ENV } from "./config/env";
import { getCorsOptions } from "./config/cors";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

if (ENV.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

// Swagger UI loads assets + inline JS from CDN; Helmet CSP blocks it by default.
// If you want stricter CSP later, we can add a per-route CSP just for /api and allowlist Swagger CDNs for /docs.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '1mb' }));

// Swagger UI + OpenAPI spec (static files)
app.use("/docs", express.static(path.resolve(__dirname, "../public/swagger")));

app.use("/api", apiRateLimiter);

app.use("/api/v1/roles", rolesRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/goals", goalRouter);
app.use("/api/v1/courses", learningRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/wellness", wellnessRouter);
app.use("/api/v1/agent", agentRouter);
app.use("/api/v1/payroll", payrollRouter);
app.use("/api/v1/attendance", attendanceRouter);
app.use("/api/v1/ai", aiRouter);
app.get("/", (req, res) => {
  res.send("API is running");
});

app.use(notFoundHandler);
app.use(errorMiddleware);

export default app;
