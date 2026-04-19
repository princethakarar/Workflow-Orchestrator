import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/databaseConnection.js";
import { logger } from "./utils/logger.js";
import { startProjectScheduler } from "./services/projectSchedulerService.js";

dotenv.config({
    path: "./.env",
});

const port = process.env.PORT || 3000;

connectDB()
    .then(() => {
        startProjectScheduler();
        app.listen(port, () => {
            logger.info(`Server running on port ${port}`);
        });
    })
    .catch((err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    });
