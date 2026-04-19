import { Project } from "../models/projectModel.js"
import { Task } from "../models/Task.js"
import { User } from "../models/userModel.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"

// ─────────────────────────────────────────────
//  ADMIN ANALYTICS
// ─────────────────────────────────────────────
export const getAdminAnalytics = asyncHandler(async (req, res) => {
    // 1. Project counts by status
    const [totalProjects, activeProjects, completedProjects, onHoldProjects, planningProjects] =
        await Promise.all([
            Project.countDocuments(),
            Project.countDocuments({ status: 'active' }),
            Project.countDocuments({ status: 'completed' }),
            Project.countDocuments({ status: 'onHold' }),
            Project.countDocuments({ status: 'planning' }),
        ])

    // 2. User counts
    const [totalDevelopers, totalManagers] = await Promise.all([
        User.countDocuments({ role: 'developer' }),
        User.countDocuments({ role: 'projectManager' }),
    ])

    // 3. Subtask statistics (across all tasks)
    const allTasks = await Task.find({}).select('subtasks')
    let totalSubtasks = 0
    let completedSubtasks = 0
    let inProgressSubtasks = 0

    allTasks.forEach(task => {
        task.subtasks.forEach(st => {
            totalSubtasks++
            if (st.isCompleted) {
                completedSubtasks++
            } else if (st.assignedTo && st.assignedTo.length > 0) {
                inProgressSubtasks++
            }
        })
    })

    const completionRate = totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0

    // 4. Recent projects with progress (all projects, team members populated)
    const projects = await Project.find()
        .populate('manager', 'fullName email')
        .populate('team.user', 'fullName email avatar')
        .sort({ createdAt: -1 })
        .lean()

    const projectsWithProgress = await Promise.all(
        projects.map(async (project) => {
            const tasks = await Task.find({ project: project._id }).select('subtasks').lean()
            let pTotal = 0
            let pDone = 0
            tasks.forEach(t => {
                pTotal += t.subtasks.length
                pDone += t.subtasks.filter(s => s.isCompleted).length
            })
            // Auto-compute status: completed if all subtasks done (and has subtasks), else development
            const autoStatus = (pTotal > 0 && pDone === pTotal) ? 'completed' : 'development'
            return {
                _id: project._id,
                name: project.name,
                manager: project.manager,
                status: autoStatus,
                storedStatus: project.status,
                team: (project.team || []).map(m => ({
                    _id: m.user?._id,
                    fullName: m.user?.fullName || m.user?.email || '?',
                    avatar: m.user?.avatar,
                })),
                teamSize: project.team?.length || 0,
                progress: pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0,
                totalTasks: tasks.length,
                completedSubtasks: pDone,
                totalSubtasks: pTotal,
            }
        })
    )

    // 5. Developer performance — rank by subtasks where developer is in assignedTo (task ownership)
    const developers = await User.find({ role: 'developer' })
        .select('fullName email specialization avatar')
        .lean()

    const developerPerformance = await Promise.all(
        developers.map(async (dev) => {
            // Find tasks where this developer is assigned to any subtask
            const tasks = await Task.find({
                'subtasks.assignedTo': dev._id
            }).select('subtasks').lean()

            let completedCount = 0
            tasks.forEach(task => {
                task.subtasks.forEach(st => {
                    // Count subtask as completed BY this developer if they are in assignedTo
                    const isAssigned = st.assignedTo?.some(id => id.toString() === dev._id.toString())
                    if (isAssigned && st.isCompleted) {
                        completedCount++
                    }
                })
            })

            return {
                _id: dev._id,
                name: dev.fullName || dev.email,
                specialization: dev.specialization,
                avatar: dev.avatar,
                completedSubtasks: completedCount,
            }
        })
    )
    developerPerformance.sort((a, b) => b.completedSubtasks - a.completedSubtasks)

    // 5b. Manager performance — rank by completed subtasks in their projects
    const managers = await User.find({ role: 'projectManager' })
        .select('fullName email avatar')
        .lean()

    const managerPerformance = await Promise.all(
        managers.map(async (mgr) => {
            // Get all projects managed by this manager
            const mgrProjects = await Project.find({ manager: mgr._id }).select('_id').lean()
            const mgrProjectIds = mgrProjects.map(p => p._id)

            if (mgrProjectIds.length === 0) return { _id: mgr._id, name: mgr.fullName || mgr.email, avatar: mgr.avatar, completedSubtasks: 0 }

            // Count completed subtasks across all tasks in those projects
            const mgrTasks = await Task.find({ project: { $in: mgrProjectIds } }).select('subtasks').lean()
            let completedCount = 0
            mgrTasks.forEach(task => {
                task.subtasks.forEach(st => {
                    if (st.isCompleted) completedCount++
                })
            })

            return {
                _id: mgr._id,
                name: mgr.fullName || mgr.email,
                avatar: mgr.avatar,
                completedSubtasks: completedCount,
            }
        })
    )
    managerPerformance.sort((a, b) => b.completedSubtasks - a.completedSubtasks)

    // 6. Recent activity — show ASSIGNED DEVELOPER, not who clicked complete
    const recentTaskDocs = await Task.find({
        'subtasks.completedAt': { $exists: true, $ne: null }
    })
        .populate('project', 'name')
        .populate('subtasks.assignedTo', 'fullName email avatar')
        .populate('subtasks.completedBy', 'fullName email avatar')
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean()

    const recentActivity = []
    recentTaskDocs.forEach(task => {
        task.subtasks
            .filter(st => st.completedAt)
            .forEach(st => {
                // Prefer the first assigned developer; fall back to completedBy
                const developer = (st.assignedTo && st.assignedTo.length > 0)
                    ? st.assignedTo[0]
                    : st.completedBy
                recentActivity.push({
                    type: 'subtask_completed',
                    user: developer,            // ← assigned developer
                    subtaskTitle: st.title,
                    taskTitle: task.title,
                    projectName: task.project?.name,
                    timestamp: st.completedAt,
                })
            })
    })
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    // 7. Daily completion activity for last 30 days (for the chart)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const allCompletedTasks = await Task.find({
        'subtasks.completedAt': { $exists: true, $ne: null, $gte: thirtyDaysAgo }
    }).select('subtasks.completedAt subtasks.isCompleted').lean()

    // Build a map of date -> count
    const activityMap = {}
    allCompletedTasks.forEach(task => {
        task.subtasks.forEach(st => {
            if (st.completedAt && new Date(st.completedAt) >= thirtyDaysAgo) {
                const dateKey = new Date(st.completedAt).toISOString().split('T')[0]
                activityMap[dateKey] = (activityMap[dateKey] || 0) + 1
            }
        })
    })

    // Build last 30 days array
    const completionActivity = []
    for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        const key = d.toISOString().split('T')[0]
        const fullDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        completionActivity.push({
            date: key,
            fullDate,                         // e.g. "13 March 2026" for tooltip
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate(),
            completed: activityMap[key] || 0,
        })
    }

    return res.status(200).json(
        new ApiResponse(200, {
            stats: {
                totalProjects,
                activeProjects,         // stored DB active status count
                completedProjects,      // stored DB completed status count
                onHoldProjects,
                planningProjects,
                totalDevelopers,
                totalManagers,
                totalSubtasks,
                completedSubtasks,
                inProgressSubtasks,
                completionRate,
                // Auto-computed from subtask analysis (used by dashboard)
                developmentProjects: projectsWithProgress.filter(p => p.status === 'development').length,
                completedProjectsComputed: projectsWithProgress.filter(p => p.status === 'completed').length,
            },
            projectsByStatus: {
                active: activeProjects,
                onHold: onHoldProjects,
                completed: completedProjects,
                planning: planningProjects,
            },
            projects: projectsWithProgress,
            developerPerformance: developerPerformance.slice(0, 10),
            managerPerformance: managerPerformance.slice(0, 10),
            recentActivity: recentActivity.slice(0, 10),
            completionActivity,
        }, "Admin analytics fetched successfully")
    )
})

// ─────────────────────────────────────────────
//  MANAGER ANALYTICS
// ─────────────────────────────────────────────
export const getManagerAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id

    // 1. PM's projects
    const myProjects = await Project.find({ manager: userId })
        .populate('team.user', 'fullName email specialization status')
        .lean()

    const projectIds = myProjects.map(p => p._id)

    const totalProjects = myProjects.length
    const activeProjects = myProjects.filter(p => p.status === 'active').length
    const completedProjects = myProjects.filter(p => p.status === 'completed').length

    // Unique developer IDs across all PM's projects
    const developerIdSet = new Set()
    myProjects.forEach(project => {
        project.team?.forEach(member => {
            if (member.user) developerIdSet.add(member.user._id?.toString() || member.user.toString())
        })
    })
    const totalTeamMembers = developerIdSet.size

    // 2. Task statistics for PM's projects
    const myTasks = await Task.find({ project: { $in: projectIds } })
        .select('subtasks deadline priority status title project')
        .lean()

    let totalSubtasks = 0
    let completedSubtasks = 0
    let tasksThisWeek = 0

    const today = new Date()
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)

    myTasks.forEach(task => {
        let isTaskComplete = task.status === 'completed';
        if (!isTaskComplete && task.subtasks && task.subtasks.length > 0) {
            isTaskComplete = task.subtasks.every(st => st.isCompleted);
        }

        task.subtasks.forEach(st => {
            totalSubtasks++
            if (st.isCompleted) completedSubtasks++
        })
        
        if (!isTaskComplete && task.deadline && new Date(task.deadline) >= startOfDay && new Date(task.deadline) <= weekFromNow) {
            tasksThisWeek++
        }
    })

    const completionRate = totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : 0

    // 3. Projects with progress
    const projectsWithProgress = await Promise.all(
        myProjects.map(async (project) => {
            const tasks = await Task.find({ project: project._id }).select('subtasks').lean()
            let pTotal = 0
            let pDone = 0
            tasks.forEach(t => {
                pTotal += t.subtasks.length
                pDone += t.subtasks.filter(s => s.isCompleted).length
            })
            // Auto-compute status exactly like the Admin Analytics
            const autoStatus = (pTotal > 0 && pDone === pTotal) ? 'completed' : 'development'
            return {
                _id: project._id,
                name: project.name,
                status: autoStatus,
                teamSize: project.team?.length || 0,
                progress: pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0,
                totalTasks: tasks.length,
                completedSubtasks: pDone,
                totalSubtasks: pTotal,
            }
        })
    )

    // 4. Team performance (filtered to PM's devs)
    const developerIds = Array.from(developerIdSet)
    const teamMembers = await User.find({
        _id: { $in: developerIds }
    }).select('fullName email specialization status avatar').lean()

    const teamPerformance = await Promise.all(
        teamMembers.map(async (dev) => {
            let completedCount = 0
            let assignedCount = 0

            myTasks.forEach(task => {
                task.subtasks.forEach(st => {
                    const isAssigned = st.assignedTo?.some(id => id.toString() === dev._id.toString())
                    if (isAssigned) {
                        assignedCount++
                        if (st.isCompleted) completedCount++
                    }
                })
            })

            return {
                _id: dev._id,
                name: dev.fullName || dev.email,
                specialization: dev.specialization,
                status: dev.status,
                avatar: dev.avatar,
                completedSubtasks: completedCount,
                assignedSubtasks: assignedCount,
                completionRate: assignedCount > 0
                    ? Math.round((completedCount / assignedCount) * 100)
                    : 0,
            }
        })
    )

    teamPerformance.sort((a, b) => b.completedSubtasks - a.completedSubtasks)

    // 5. Upcoming deadlines (next 14 days, sorted asc)
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    const upcomingTasks = myTasks
        .filter(t => t.deadline && new Date(t.deadline) >= startOfDay && new Date(t.deadline) <= twoWeeksFromNow)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 10)

    const upcomingDeadlines = upcomingTasks.map(task => {
        const proj = myProjects.find(p => p._id.toString() === task.project.toString())
        return {
            _id: task._id,
            title: task.title,
            projectId: task.project,
            projectName: proj?.name || '',
            deadline: task.deadline,
            priority: task.priority,
            status: task.status,
        }
    })

    // 6. Daily completion activity for last 30 days (for the chart)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const activityMap = {}
    myTasks.forEach(task => {
        task.subtasks.forEach(st => {
            if (st.isCompleted && st.completedAt && new Date(st.completedAt) >= thirtyDaysAgo) {
                const dateKey = new Date(st.completedAt).toISOString().split('T')[0]
                activityMap[dateKey] = (activityMap[dateKey] || 0) + 1
            }
        })
    })

    const completionActivity = []
    for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        const key = d.toISOString().split('T')[0]
        const fullDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        completionActivity.push({
            date: key,
            fullDate,
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate(),
            completed: activityMap[key] || 0,
        })
    }

    return res.status(200).json(
        new ApiResponse(200, {
            stats: {
                totalProjects,
                developmentProjects: projectsWithProgress.filter(p => p.status === 'development').length,
                completedProjects,
                totalTeamMembers,
                totalSubtasks,
                completedSubtasks,
                tasksThisWeek,
                completionRate,
            },
            projects: projectsWithProgress,
            teamPerformance,
            upcomingDeadlines,
            completionActivity,
        }, "Manager analytics fetched successfully")
    )
})

// ─────────────────────────────────────────────
//  DEVELOPER ANALYTICS
// ─────────────────────────────────────────────
export const getDeveloperAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id

    // 1. Developer's projects (via team.user)
    const myProjects = await Project.find({ 'team.user': userId })
        .select('name manager status priority endDate')
        .populate('manager', 'fullName email')
        .lean()

    const projectIds = myProjects.map(p => p._id)

    // 2. Tasks where developer is in subtask.assignedTo or task.assignedTo
    const myTasks = await Task.find({
        project: { $in: projectIds },
        $or: [
            { 'subtasks.assignedTo': userId },
            { assignedTo: userId },
        ]
    })
        .populate('project', 'name')
        .lean()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    let totalAssigned = 0
    let totalCompleted = 0
    let totalInProgress = 0
    let totalPending = 0
    let completedThisMonth = 0

    const mySubtasks = []
    const tasksByProjectMap = {}

    myTasks.forEach(task => {
        task.subtasks.forEach(st => {
            const isAssignedSub = st.assignedTo?.some(id => id.toString() === userId.toString())
            const isAssignedTask = task.assignedTo?.some(id => id.toString() === userId.toString())

            if (!isAssignedSub && !isAssignedTask) return

            totalAssigned++

            if (st.isCompleted) {
                totalCompleted++
                if (st.completedAt && new Date(st.completedAt) >= startOfMonth) {
                    completedThisMonth++
                }
            } else if (st.assignedTo?.length > 0) {
                totalInProgress++
            } else {
                totalPending++
            }

            if (!st.isCompleted) {
                const projName = task.project?.name || 'Unknown'
                if (!tasksByProjectMap[projName]) tasksByProjectMap[projName] = 0
                tasksByProjectMap[projName]++

                mySubtasks.push({
                    _id: st._id,
                    title: st.title,
                    taskTitle: task.title,
                    taskId: task._id,
                    projectName: projName,
                    projectId: task.project?._id,
                    priority: task.priority,
                    deadline: task.deadline,
                    status: st.assignedTo?.length > 0 ? 'in-progress' : 'pending',
                    isOverdue: task.deadline && new Date(task.deadline) < today,
                })
            }
        })
    })

    // Sort: overdue first, then by deadline asc
    mySubtasks.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1
        if (!a.isOverdue && b.isOverdue) return 1
        if (!a.deadline && b.deadline) return 1
        if (a.deadline && !b.deadline) return -1
        if (!a.deadline && !b.deadline) return 0
        return new Date(a.deadline) - new Date(b.deadline)
    })

    // 3. Weekly progress (last 7 days)
    const weeklyProgress = []
    for (let i = 6; i >= 0; i--) {
        const dayStart = new Date()
        dayStart.setDate(dayStart.getDate() - i)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        let count = 0
        myTasks.forEach(task => {
            task.subtasks.forEach(st => {
                if (
                    st.completedBy?.toString() === userId.toString() &&
                    st.completedAt &&
                    new Date(st.completedAt) >= dayStart &&
                    new Date(st.completedAt) < dayEnd
                ) {
                    count++
                }
            })
        })

        weeklyProgress.push({
            date: dayStart.toISOString().split('T')[0],
            day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
            completed: count,
        })
    }

    const tasksByProject = Object.entries(tasksByProjectMap).map(([name, count]) => ({ name, count }))

    const enrichedProjects = myProjects.map(p => ({
        _id: p._id,
        name: p.name,
        manager: p.manager,
        status: p.status,
        priority: p.priority,
        endDate: p.endDate,
        taskCount: tasksByProjectMap[p.name] || 0,
    }))

    const activeProjects = myProjects.length
    const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0

    // Daily completion activity for last 30 days (for the chart)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const activityMap = {}
    const rawActivity = []

    myTasks.forEach(task => {
        task.subtasks.forEach(st => {
            const isAssigned = st.assignedTo?.some(id => id.toString() === userId.toString())
            if (!isAssigned) return;

            const projName = task.project?.name || 'Unknown'

            if (st.isCompleted && st.completedBy?.toString() === userId.toString() && st.completedAt) {
                if (new Date(st.completedAt) >= thirtyDaysAgo) {
                    const dateKey = new Date(st.completedAt).toISOString().split('T')[0]
                    activityMap[dateKey] = (activityMap[dateKey] || 0) + 1
                }
                rawActivity.push({
                    _id: st._id + '-comp',
                    action: 'Completed',
                    text: st.title,
                    project: projName,
                    timestamp: st.completedAt
                })
            }

            rawActivity.push({
                _id: st._id + '-upd',
                action: st.isCompleted ? 'Completed' : (task.updatedAt ? 'Updated' : 'Assigned'),
                text: st.title,
                project: projName,
                timestamp: task.updatedAt || task.createdAt || new Date()
            })
        })
    })

    const completionActivity = []
    for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        const dateKey = d.toISOString().split('T')[0]
        completionActivity.push({
            date: dateKey,
            day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            completed: activityMap[dateKey] || 0
        })
    }

    // Synthesize developerActivity
    rawActivity.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    const uniqueActivity = []
    const seenMap = new Set()
    for (const act of rawActivity) {
        if (!seenMap.has(act.text)) {
            seenMap.add(act.text)
            uniqueActivity.push(act)
        }
    }
    const developerActivity = uniqueActivity.slice(0, 6)

    // Recent tasks
    const recentTasks = mySubtasks.slice(0, 5).map(t => {
        const taskObj = myTasks.find(o => o._id.toString() === t.taskId?.toString())
        return {
            ...t,
            updatedAt: taskObj?.updatedAt || taskObj?.createdAt || new Date(),
        }
    })

    return res.status(200).json(
        new ApiResponse(200, {
            stats: {
                totalAssigned,
                totalCompleted,
                totalInProgress,
                totalPending,
                completedThisMonth,
                activeProjects,
                completionRate,
            },
            projects: enrichedProjects,
            myTasks: mySubtasks,
            weeklyProgress,
            completionActivity,
            developerActivity,
            recentTasks,
            tasksByProject,
        }, "Developer analytics fetched successfully")
    )
})
