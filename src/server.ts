import dotenv from "dotenv";
import app from "./app";
import logger from "./config/logger";

dotenv.config();

function validateServerEnv() {
    const required = ["JWT_SECRET", "JWT_REFRESH_SECRET"];

    const missing = required.filter(
        (key) => !process.env[key]
    );

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variable(s): ${missing.join(", ")}`
        );
    }
}

try {
    validateServerEnv();

    // Run locally only
    if (process.env.NODE_ENV !== "production") {
        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    }
} catch (error) {
    logger.error("Failed to start server:", error);
}

export default app;