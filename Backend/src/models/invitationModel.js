import mongoose, { Schema } from "mongoose"

const invitationSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        role: {
            type: String,
            enum: ['developer', 'projectManager'],
            required: true
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'expired'],
            default: 'pending'
        },
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
)

// Create index for faster lookups
invitationSchema.index({ email: 1, status: 1 })
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index for auto-cleanup

export const Invitation = mongoose.model("Invitation", invitationSchema)
