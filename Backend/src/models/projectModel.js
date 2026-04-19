import mongoose, { Schema } from "mongoose"

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            maxlength: [100, "Project name cannot exceed 100 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"]
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, "Project owner is required"]
        },
        manager: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, "Project manager is required"],
            validate: {
                validator: async function (userId) {
                    const User = mongoose.model('User');
                    const user = await User.findById(userId);
                    return user && (user.role === 'projectManager' || user.role === 'admin');
                },
                message: 'Assigned user must have role: projectManager or admin'
            }
        },
        status: {
            type: String,
            enum: ['planning', 'active', 'onHold', 'completed', 'cancelled'],
            default: 'planning'
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },
        team: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            role: {
                type: String,
                default: 'developer'
            },
            assignedAt: {
                type: Date,
                default: Date.now
            }
        }],
        completedAt: {
            type: Date,
            default: null
        },
        tags: [{
            type: String,
            trim: true
        }]
    },
    {
        timestamps: true
    }
)

// Index for faster queries
projectSchema.index({ owner: 1, status: 1 })
projectSchema.index({ name: 'text', description: 'text' })

export const Project = mongoose.model("Project", projectSchema)
