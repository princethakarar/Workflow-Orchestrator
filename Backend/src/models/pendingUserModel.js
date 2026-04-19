import mongoose, { Schema } from "mongoose"
import crypto from "crypto"

const pendingUserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            unique: true,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        otpHash: {
            type: String,
            required: true
        },
        otpExpiry: {
            type: Date,
            required: true
        },
        role: {
            type: String,
            enum: ['developer', 'projectManager', 'admin'],
            default: 'developer',
            required: true
        }
    }, {
    timestamps: true
}
)

// Add TTL index to expire after 15 minutes
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

// Helper to check password (not needed, we just move data)

export const PendingUser = mongoose.model("PendingUser", pendingUserSchema)
