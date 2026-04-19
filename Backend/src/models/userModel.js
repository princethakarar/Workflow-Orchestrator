import mongoose, { Schema } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const userSchema = new Schema(
    {
        avatar: {
            type: {
                url: String,
                localPath: String
            },
            default: {
                url: `https://placehold.co/200x200`,
                localPath: ""
            }
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            unique: true,
            required: true
        },
        fullName: {
            type: String,
            trim: true
        },
        password: {
            type: String,
            required: [true, "password is required"]
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        refreshToken: {
            type: String
        },
        forgotPasswordToken: {
            type: String
        },
        forgotPasswordExpiry: {
            type: Date
        },
        emailVerificationToken: {
            type: String
        },
        emailVerificationExpiry: {
            type: Date
        },
        role: {
            type: String,
            enum: ['developer', 'projectManager', 'admin'],
            default: 'developer',
            required: true
        },
        specialization: {
            type: String,
            enum: {
                values: ['Frontend', 'Backend', 'Full Stack', 'UI/UX', 'DevOps', 'Mobile', 'QA'],
                message: '{VALUE} is not a valid specialization'
            },
            required: function () {
                return this.role !== 'admin';
            }
        },
        status: {
            type: String,
            enum: ['available', 'occupied', 'inactive'],
            default: 'available'
        },
        currentProjects: [{
            type: Schema.Types.ObjectId,
            ref: 'Project'
        }],
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        lastLogin: {
            type: Date
        }
    }, {
    timestamps: true
}
)

userSchema.pre("save", async function () {                       // hook
    if (!this.isModified("password")) return;                 // if password is not modified

    this.password = await bcrypt.hash(this.password, 10)            // 10 rounds of encryption
    // next()
})

userSchema.methods.isPasswordCorrect = async function (password) {   // method
    return await bcrypt.compare(password, this.password)
}

// Tokens with data
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {                                   // payload
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role,                // Added for RBAC
            fullName: this.fullName         // Added for user display
        },
        process.env.ACCESS_TOKEN_SECRET,    // secret
        {                                   // expiry
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {                                     // payload
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,    // secret
        {                                    // expiry
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

// Tokens without data
userSchema.methods.generateTemporaryToken = function () {
    const unHashedToken = crypto.randomBytes(20).toString("hex")

    const HashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex")

    const tokenExpiry = Date.now() + (20 * 60 * 1000)                   // 20 mins

    return { unHashedToken, HashedToken, tokenExpiry }
}

userSchema.methods.generateOneTimePassword = function () {
    // Generate 6 digit OTP
    const unHashedOTP = crypto.randomInt(100000, 999999).toString()

    const HashedToken = crypto
        .createHash("sha256")
        .update(unHashedOTP)
        .digest("hex")

    const tokenExpiry = Date.now() + (60 * 1000)                   // 1 minute

    return { unHashedOTP, HashedToken, tokenExpiry }
}

// Token specifically for team member invitations (longer expiry)
userSchema.methods.generateInvitationToken = function () {
    const unHashedToken = crypto.randomBytes(20).toString("hex")

    const HashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex")

    const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000)         // 24 hours

    return { unHashedToken, HashedToken, tokenExpiry }
}

export const User = mongoose.model("User", userSchema)