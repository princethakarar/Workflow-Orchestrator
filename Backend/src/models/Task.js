import mongoose from "mongoose"

// Subtask Schema (Embedded)
const subtaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Subtask title is required'],
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    completedAt: {
        type: Date,
        default: null
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
})

// Task Schema
const taskSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project reference is required']
    },
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: {
            values: ['todo', 'in-progress', 'done'],
            message: '{VALUE} is not a valid status'
        },
        default: 'todo'
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high'],
            message: '{VALUE} is not a valid priority'
        },
        default: 'medium'
    },
    deadline: {
        type: Date
    },
    // Task-level assignment (only used when NO subtasks exist)
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    subtasks: [subtaskSchema],
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    // GitHub Issues sync fields
    githubIssueNumber: {
        type: Number,
        default: null,
    },
    githubIssueUrl: {
        type: String,
        default: null,
    },
    githubIssueNodeId: {
        type: String,
        default: null,
    },
    githubSyncEnabled: {
        type: Boolean,
        default: true,
    },
    lastSyncedAt: {
        type: Date,
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
})

// Virtual: Calculate task completion percentage
taskSchema.virtual('completionPercentage').get(function () {
    if (this.subtasks.length === 0) return 0
    const completed = this.subtasks.filter(st => st.isCompleted).length
    return Math.round((completed / this.subtasks.length) * 100)
})

// Method: Auto-update task status based on subtasks
taskSchema.methods.updateStatus = function () {
    if (this.subtasks.length === 0) {
        // No subtasks: status based on task-level assignment
        this.status = this.assignedTo.length > 0 ? 'in-progress' : 'todo'
        return
    }

    // Has subtasks: status based on subtask progress
    const completedCount = this.subtasks.filter(st => st.isCompleted).length
    const assignedCount = this.subtasks.filter(st => st.assignedTo && st.assignedTo.length > 0).length

    if (completedCount === this.subtasks.length) {
        this.status = 'done'
    } else if (completedCount > 0 || assignedCount > 0) {
        this.status = 'in-progress'
    } else {
        this.status = 'todo'
    }
}

// Pre-save hook: Auto-update status
taskSchema.pre('save', async function () {
    this.updateStatus()
})

// Ensure virtuals are included in JSON
taskSchema.set('toJSON', { virtuals: true })
taskSchema.set('toObject', { virtuals: true })

export const Task = mongoose.model('Task', taskSchema)
