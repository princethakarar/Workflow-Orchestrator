import mongoose, { Schema } from "mongoose"

// Position-only node schema — data comes from live Task model at read time
const nodeSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    position: {
        x: {
            type: Number,
            required: true,
            default: 100
        },
        y: {
            type: Number,
            required: true,
            default: 100
        }
    }
}, { _id: false })

const edgeSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    target: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'smoothstep'
    }
}, { _id: false })

const workflowSchema = new Schema(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, "Project ID is required"],
            unique: true
        },
        nodes: {
            type: [nodeSchema],
            default: []
        },
        edges: {
            type: [edgeSchema],
            default: []
        },
        lastUpdatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
)


export const Workflow = mongoose.model("Workflow", workflowSchema)
