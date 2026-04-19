import { Octokit } from "@octokit/rest"

// Lazy getter — creates Octokit at call time (after dotenv has initialized)
const getOctokit = () => new Octokit({
    auth: process.env.GITHUB_TOKEN,
})

// Lazy getters — read env vars at call time (after dotenv has initialized)
const getOwner = () => process.env.GITHUB_OWNER
const getRepo = () => process.env.GITHUB_REPO

/**
 * Creates a GitHub Issue from a task object
 * @param {Object} task - Mongoose task document
 * @returns {Object} - { issueNumber, issueUrl, issueNodeId }
 */
export const createIssue = async (task) => {
    const response = await getOctokit().issues.create({
        owner: getOwner(),
        repo: getRepo(),
        title: `[Task] ${task.title}`,
        body: buildIssueBody(task),
        labels: buildLabels(task),
    })

    return {
        issueNumber: response.data.number,
        issueUrl: response.data.html_url,
        issueNodeId: response.data.node_id,
    }
}

/**
 * Updates an existing GitHub Issue
 * @param {number} issueNumber
 * @param {Object} task
 */
export const updateIssue = async (issueNumber, task) => {
    await getOctokit().issues.update({
        owner: getOwner(),
        repo: getRepo(),
        issue_number: issueNumber,
        title: `[Task] ${task.title}`,
        body: buildIssueBody(task),
        labels: buildLabels(task),
    })
}

/**
 * Closes a GitHub Issue (called when task status becomes 'done')
 * @param {number} issueNumber
 */
export const closeIssue = async (issueNumber) => {
    await getOctokit().issues.update({
        owner: getOwner(),
        repo: getRepo(),
        issue_number: issueNumber,
        state: "closed",
    })
}

/**
 * Reopens a GitHub Issue (when task status changes from 'done' back)
 * @param {number} issueNumber
 */
export const reopenIssue = async (issueNumber) => {
    await getOctokit().issues.update({
        owner: getOwner(),
        repo: getRepo(),
        issue_number: issueNumber,
        state: "open",
    })
}

/**
 * Permanently deletes a GitHub Issue using GraphQL API
 * @param {string} issueNodeId - The GraphQL node_id of the issue
 */
export const deleteIssue = async (issueNodeId) => {
    const mutation = `
        mutation DeleteIssue($issueId: ID!) {
            deleteIssue(input: { issueId: $issueId }) {
                repository {
                    name
                }
            }
        }
    `

    await getOctokit().graphql(mutation, {
        issueId: issueNodeId,
    })
}

// Helper: Build markdown body for the issue
const buildIssueBody = (task) => {
    const statusLabel = task.status === 'done' ? '✅ Done' :
        task.status === 'in-progress' ? '🔄 In Progress' : '📋 To Do'

    const subtaskList = task.subtasks && task.subtasks.length > 0
        ? task.subtasks.map(st => `- [${st.isCompleted ? 'x' : ' '}] ${st.title}`).join('\n')
        : '_No subtasks_'

    return `
## 📋 Task Details — Workflow Orchestrator

| Field | Value |
|-------|-------|
| **Description** | ${task.description || "No description provided"} |
| **Priority** | ${(task.priority || "medium").toUpperCase()} |
| **Deadline** | ${task.deadline ? new Date(task.deadline).toDateString() : "Not set"} |
| **Status** | ${statusLabel} |

### Subtasks
${subtaskList}

---
> 🔗 This issue is synced with [Workflow Orchestrator](https://github.com/${getOwner()}/${getRepo()})
> ⚠️ Do not manually edit the table above — it will be overwritten on next sync.
    `.trim()
}

// Helper: Build label array from task data
const buildLabels = (task) => {
    const labels = ["workflow-orchestrator"]
    if (task.priority) labels.push(`priority:${task.priority}`)
    if (task.status === 'done') labels.push("completed")
    if (task.deadline && new Date(task.deadline) < new Date()) labels.push("overdue")
    return labels
}
