import { Project } from "../models/projectModel.js";
import { Task } from "../models/Task.js";
import { User } from "../models/userModel.js";

/**
 * Handles the logic for completing a project and releasing team members.
 * Removes all team members from the project and unassigns the project manager.
 *
 * @param {Object} project - The Mongoose project document (must be populated with team.user and manager)
 * @returns {Object} - { releasedMembers, skippedMembers, managerUnassigned }
 */
export const releaseProjectTeam = async (project) => {
    const releasedMembers = [];
    const skippedMembers = [];
    let managerUnassigned = null;

    const checkAndMarkUserAvailable = async (userId, userRole) => {
        const user = await User.findById(userId).select(
            "fullName email status role",
        );
        if (!user) return null;

        if (user.status === "inactive") {
            skippedMembers.push({
                userId: user._id,
                name: user.fullName || user.email,
                role: userRole,
                reason: "INACTIVE — invite pending, status unchanged",
            });
            return null;
        }

        let remainingProjects = 0;
        if (user.role === "projectManager") {
            remainingProjects = await Project.countDocuments({
                manager: user._id,
                status: { $nin: ["completed", "cancelled"] },
                _id: { $ne: project._id },
            });
        } else if (user.role === "developer") {
            remainingProjects = await Project.countDocuments({
                "team.user": user._id,
                status: { $nin: ["completed", "cancelled"] },
                _id: { $ne: project._id },
            });
        }

        const newStatus = remainingProjects > 0 ? "OCCUPIED" : "AVAILABLE";
        return {
            userId: user._id,
            name: user.fullName || user.email,
            role: userRole,
            newStatus,
            remainingProjects,
        };
    };

    if (project.manager) {
        const managerId = project.manager._id || project.manager;
        const managerResult = await checkAndMarkUserAvailable(
            managerId,
            "ProjectManager",
        );
        if (managerResult) {
            managerUnassigned = managerResult;
        }
    }

    if (project.team && project.team.length > 0) {
        for (const member of project.team) {
            const userId = member.user?._id || member.user;
            const memberResult = await checkAndMarkUserAvailable(
                userId,
                "Developer",
            );
            if (memberResult) {
                releasedMembers.push(memberResult);
            }
        }
    }

    project.team = [];
    project.manager = null;
    project.status = "completed";
    project.completedAt = new Date();
    await project.save();

    return { releasedMembers, skippedMembers, managerUnassigned };
};

/**
 * Calculate project progress from its tasks/subtasks.
 * @param {string} projectId
 * @returns {number} - Progress percentage (0-100)
 */
export const calculateProjectProgress = async (projectId) => {
    const tasks = await Task.find({ project: projectId });

    let totalSubtasks = 0;
    let completedSubtasks = 0;

    tasks.forEach((task) => {
        totalSubtasks += task.subtasks.length;
        completedSubtasks += task.subtasks.filter(
            (st) => st.isCompleted,
        ).length;
    });

    return totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0;
};

/**
 * Check if a project should auto-complete based on progress, and do so.
 * @param {string} projectId
 * @returns {Object|null} - Release result if project was completed, null otherwise
 */
export const checkAndAutoCompleteProject = async (projectId) => {
    const progress = await calculateProjectProgress(projectId);

    if (progress === 100) {
        const project = await Project.findById(projectId);
        if (
            project &&
            project.status !== "completed" &&
            project.status !== "cancelled"
        ) {
            const result = await releaseProjectTeam(project);
            return {
                projectId,
                completedAt: project.completedAt,
                progress,
                ...result,
            };
        }
    }

    return null;
};
