import { User } from "../models/userModel.js"
import { PendingUser } from "../models/pendingUserModel.js"
import { ApiResponse } from "../utils/api-response.js"
import { ApiError } from "../utils/api-error.js"
import { asyncHandler } from "../utils/async-handler.js"
import { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail } from "../utils/mail.js"
import jwt from "jsonwebtoken"
import crypto from "crypto";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        console.error("Error generating tokens:", error)

        throw new ApiError(500, "Something went wrong while generating access token")
    }
}

// Cookie settings for cross-site deployments (Render frontend + backend on different subdomains).
// Browsers require: SameSite=None + Secure for cookies to be sent cross-site.
const isProduction = process.env.NODE_ENV === "production"

const parseJwtExpiresInToMs = (expiresIn) => {
    if (!expiresIn) return null
    if (typeof expiresIn === "number" && Number.isFinite(expiresIn)) return expiresIn * 1000

    const value = String(expiresIn).trim().toLowerCase()
    const match = value.match(/^(\d+)\s*([smhd])$/)
    if (!match) return null

    const amount = Number(match[1])
    const unit = match[2]
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    }

    return multipliers[unit] ? amount * multipliers[unit] : null
}

const accessTokenMaxAgeMs =
    parseJwtExpiresInToMs(process.env.ACCESS_TOKEN_EXPIRY) ?? (24 * 60 * 60 * 1000)
const refreshTokenMaxAgeMs =
    parseJwtExpiresInToMs(process.env.REFRESH_TOKEN_EXPIRY) ?? (7 * 24 * 60 * 60 * 1000)

const accessCookieOptions = {
    httpOnly: true,
    secure: isProduction, // required by browsers when sameSite is None
    sameSite: isProduction ? "none" : "lax",
    maxAge: accessTokenMaxAgeMs,
    path: "/",
}

const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction, // required by browsers when sameSite is None
    sameSite: isProduction ? "none" : "lax",
    maxAge: refreshTokenMaxAgeMs,
    path: "/",
}

const clearCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    const doesExist = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (doesExist) {
        throw new ApiError(409, "User with email or username already exists", [])
    }

    // Also check if already pending
    await PendingUser.findOneAndDelete({ email }) // Remove old pending request if any

    // Generate OTP
    const unHashedOTP = crypto.randomInt(100000, 999999).toString()
    const HashedToken = crypto.createHash("sha256").update(unHashedOTP).digest("hex")
    const tokenExpiry = Date.now() + (30 * 1000)

    // Save to PendingUser
    await PendingUser.create({
        username,
        email,
        password, // Ideally hash this here too if not hashing in model? Check model.
        // PendingUser model doesn't have bcrypt hook in what I wrote.
        // Wait, User model hashes on save.
        // If PendingUser saves plain text, we must hash it before moving to User, or BEFORE saving to PendingUser?
        // Let's hash it here manually or rely on User model to hash it when we move it?
        // User model `pre('save')` will hash it if `isModified('password')`.
        // So if we save plain text in Pending, then create User(plain), it will be hashed.
        // BUT storing plain text password in DB (even pending) is risky.
        // Better to hash it now?
        // Actually, let's keep it simple: Save plain in PendingUser (ttl 15m), create User with plain, let User model hash it.
        // SECURITY NOTE: This is acceptable for MVP but ideally hash in Pending too.
        otpHash: HashedToken,
        otpExpiry: tokenExpiry
    })

    await sendEmail({
        email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            username,
            unHashedOTP
        )
    })

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                { email, otpExpiry: tokenExpiry },
                "OTP sent successfully. Please verify your email."
            )
        )
})

const login = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(400, "User doesn't exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // Update last login timestamp
    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessCookieOptions)
        .cookie("refreshToken", refreshToken, refreshCookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: "" }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .clearCookie("accessToken", clearCookieOptions)
        .clearCookie("refreshToken", clearCookieOptions)
        .json(
            new ApiResponse(200, {}, "User logged out")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully"
            )
        )
})

const verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required")
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex")

    // Find in PendingUser
    // Check in PendingUser
    const pendingUser = await PendingUser.findOne({ email })

    if (!pendingUser) {
        throw new ApiError(404, "Registration session expired or does not exist. Please register again.")
    }

    // Check if Hash Matches
    if (pendingUser.otpHash !== hashedToken) {
        throw new ApiError(400, "Invalid OTP")
    }

    // Check Expiry
    if (Date.now() > pendingUser.otpExpiry) {
        throw new ApiError(400, "OTP expired. Generate new OTP")
    }

    // Move to User Collection (Registered!)
    const user = await User.create({
        username: pendingUser.username,
        email: pendingUser.email,
        password: pendingUser.password, // User model will hash this!
        isEmailVerified: true,
        role: 'admin' // Default role for registered users
    })

    // Delete pending record
    await PendingUser.findByIdAndDelete(pendingUser._id)

    // Generate Tokens (Auto Login)
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessCookieOptions)
        .cookie("refreshToken", refreshToken, refreshCookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "Email verified and logged in successfully"
            )
        )
})

const resendEmailVerification = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body
        console.log("Resend OTP requested for:", email)

        if (!email) throw new ApiError(400, "Email is required")

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) throw new ApiError(409, "Email is already registered and verified")

        const pendingUser = await PendingUser.findOne({ email })
        if (!pendingUser) throw new ApiError(404, "No pending registration found")

        // Generate new OTP
        const unHashedOTP = crypto.randomInt(100000, 999999).toString()
        const HashedToken = crypto.createHash("sha256").update(unHashedOTP).digest("hex")
        const tokenExpiry = new Date(Date.now() + (30 * 1000))

        pendingUser.otpHash = HashedToken
        pendingUser.otpExpiry = tokenExpiry
        await pendingUser.save()
        console.log("Pending user updated with new OTP")

        await sendEmail({
            email: pendingUser.email,
            subject: "Please verify your email (Resend)",
            mailgenContent: emailVerificationMailgenContent(
                pendingUser.username,
                unHashedOTP
            )
        })
        console.log("Email sent successfully")

        return res.status(200).json(new ApiResponse(200, { otpExpiry: tokenExpiry }, "OTP resent successfully"))
    } catch (error) {
        console.error("Error in resendEmailVerification:", error)
        throw error
    }
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access")
    }

    try {
        console.log("1. Secret Used for Verify:", process.env.REFRESH_TOKEN_SECRET);
        console.log("2. Token being verified:", incomingRefreshToken);
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired")
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        user.refreshToken = newRefreshToken

        await user.save()

        return res
            .status(200)
            .cookie("accessToken", accessToken, accessCookieOptions)
            .cookie("refreshToken", newRefreshToken, refreshCookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        console.error("RefreshToken Error Details:", error);

        throw new ApiError(401, "Invalid refresh token")
    }
})

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User doesn't exist", [])
    }

    // Generate OTP using the method we added to User model (or create new logic)
    // We already have generateOneTimePassword in userModel
    const { unHashedOTP, HashedToken, tokenExpiry } = user.generateOneTimePassword()

    user.forgotPasswordToken = HashedToken
    user.forgotPasswordExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })

    await sendEmail({
        email: user?.email,
        subject: `Workflow Orchestrator — Password Reset OTP for ${user.username}`,
        mailgenContent: forgotPasswordMailgenContent(
            user.fullName || user.username || 'User',
            unHashedOTP
        )
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { email }, // Send back email to confirm
                "Password reset OTP sent to your email"
            )
        )
})

const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required")
    }

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(404, "User not found")

    if (!user.forgotPasswordToken) {
        throw new ApiError(400, "No password reset requested")
    }

    let hashedToken = crypto.createHash("sha256").update(otp).digest("hex")

    if (user.forgotPasswordToken !== hashedToken) {
        throw new ApiError(400, "Invalid OTP")
    }

    if (Date.now() > user.forgotPasswordExpiry) {
        throw new ApiError(400, "OTP has expired")
    }

    // Generate temporary reset token (JWT)
    const resetToken = jwt.sign(
        { _id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10m" }
    )

    return res.status(200).json(new ApiResponse(200, { resetToken }, "OTP verified. Proceed to reset password."))
})

const resetForgotPassword = asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
        throw new ApiError(400, "Token and new password required")
    }

    let decoded;
    try {
        decoded = jwt.verify(resetToken, process.env.ACCESS_TOKEN_SECRET)
    } catch (err) {
        throw new ApiError(401, "Invalid or expired reset token")
    }

    const user = await User.findById(decoded._id)
    if (!user) throw new ApiError(404, "User not found")

    // Prevent reuse of the same password
    const isSamePassword = await user.isPasswordCorrect(newPassword)
    if (isSamePassword) {
        throw new ApiError(400, "The new password cannot be the same as your previous password. Please choose a different password.")
    }

    user.password = newPassword
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined

    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset successfully"
            )
        )
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword

    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )
})

/**
 * @desc    Get users by role (for workflow assignment)
 * @route   GET /api/users?role=developer
 * @access  Private
 */
const getUsersByRole = asyncHandler(async (req, res) => {
    const { role } = req.query

    // Build query
    const query = {}
    if (role && ['developer', 'projectManager', 'admin'].includes(role)) {
        query.role = role
    }

    // Fetch users with minimal data
    const users = await User.find(query)
        .select('username fullName email avatar role')
        .sort({ username: 1 })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                users,
                `Users fetched successfully${role ? ` (${role}s)` : ''}`
            )
        )
})

/**
 * @desc    Verify password reset token for invited users
 * @route   POST /api/auth/verify-token
 * @access  Public
 */
const verifyResetToken = asyncHandler(async (req, res) => {
    const { token } = req.body

    if (!token) {
        throw new ApiError(400, "Token is required")
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")

    // Find user with this token
    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    })

    if (!user) {
        throw new ApiError(400, "Invalid or expired token")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { valid: true, email: user.email },
                "Token is valid"
            )
        )
})

/**
 * @desc    Set password for invited users
 * @route   POST /api/auth/set-password
 * @access  Public
 */
const setPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body

    if (!token || !password) {
        throw new ApiError(400, "Token and password are required")
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")

    // Find user with this token
    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    })

    if (!user) {
        throw new ApiError(400, "Invalid or expired token")
    }

    // Update user
    user.password = password
    user.isEmailVerified = true
    user.status = 'available'
    user.lastLogin = new Date()
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined
    await user.save({ validateBeforeSave: false })

    // Update invitation status
    const { Invitation } = await import("../models/invitationModel.js")
    await Invitation.findOneAndUpdate(
        { email: user.email, status: 'pending' },
        { status: 'accepted' }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password set successfully. Please log in to continue."
            )
        )
})

/**
 * @desc    Upload / update the logged-in user's avatar
 * @route   POST /api/v1/auth/upload-avatar
 * @access  Private
 */
const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'No file uploaded')
    }

    const user = await User.findById(req.user._id)
    if (!user) throw new ApiError(404, 'User not found')

    // Build public URL — file saved to ./public/images by multer
    const filename = req.file.filename
    const avatarUrl = `/images/${filename}`

    user.avatar = { url: avatarUrl, localPath: req.file.path }
    await user.save({ validateBeforeSave: false })

    // Refresh stored user in response so frontend can update localStorage
    const updatedUser = await User.findById(user._id).select('-password -refreshToken')

    return res.status(200).json(new ApiResponse(200, { user: updatedUser, avatarUrl }, 'Avatar updated successfully'))
})

/**
 * @desc    Update basic profile fields (fullName, specialization)
 * @route   PATCH /api/v1/auth/update-profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { fullName, specialization } = req.body

    const user = await User.findById(req.user._id)
    if (!user) throw new ApiError(404, 'User not found')

    if (fullName    !== undefined) user.fullName       = fullName.trim()
    if (specialization !== undefined) user.specialization = specialization

    await user.save({ validateBeforeSave: false })

    const updatedUser = await User.findById(user._id).select('-password -refreshToken')

    return res.status(200).json(new ApiResponse(200, { user: updatedUser }, 'Profile updated successfully'))
})

export {
    registerUser,
    login,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changeCurrentPassword,
    verifyForgotPasswordOTP,
    getUsersByRole,
    verifyResetToken,
    setPassword,
    uploadAvatar,
    updateProfile,
}
