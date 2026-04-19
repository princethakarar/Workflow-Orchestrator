import cron from "node-cron";
import { Project } from "../models/projectModel.js";
import { releaseProjectTeam } from "./projectCompletionService.js";
import { logger } from "../utils/logger.js";

export const startProjectScheduler = () => {
    cron.schedule("0 * * * *", async () => {
        await checkAndCompleteExpiredProjects();
    });

    logger.info("Project deadline scheduler started — checking every hour");
};

const checkAndCompleteExpiredProjects = async () => {
    const now = new Date();

    try {
        const expiredProjects = await Project.find({
            endDate: { $lte: now },
            status: { $nin: ["completed", "cancelled"] },
        })
            .populate("manager", "fullName email")
            .populate("team.user", "fullName email specialization");

        if (expiredProjects.length === 0) {
            return;
        }

        logger.info(`Found ${expiredProjects.length} expired project(s)`);

        for (const project of expiredProjects) {
            try {
                const result = await releaseProjectTeam(project);
                logger.info(
                    `Deadline reached: Project "${project.name}" completed. ` +
                        `Released ${result.releasedMembers.length} team members, ` +
                        `PM unassigned: ${result.managerUnassigned ? "Yes" : "No"}`,
                );
            } catch (err) {
                logger.error(
                    `Failed to complete expired project ${project._id}: ${err.message}`,
                );
            }
        }
    } catch (err) {
        logger.error(`Scheduler error: ${err.message}`);
    }
};
