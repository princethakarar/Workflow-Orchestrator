import { Router } from "express";
import { registerUser, login, logoutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, getCurrentUser, resendEmailVerification, changeCurrentPassword, verifyForgotPasswordOTP, getUsersByRole, verifyResetToken, setPassword, uploadAvatar, updateProfile } from "../controllers/Auth_Controller.js";
import { validate } from "../middlewares/validator_middleware.js";
import { userRegisterValidator, userLoginValidator, userForgotPasswordValidator, userChangeCurrentPasswordValidator, userResetForgotPasswordValidator } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth_middleware.js";
import { upload } from "../middlewares/multer_middleware.js";


const router = Router()

// unsecured route
router.route("/register").post(userRegisterValidator(), validate, registerUser)
router.route("/login").post(userLoginValidator(), validate, login)
router.route("/verify-email").post(verifyEmail)
router.route("/resend-email-verification").post(resendEmailVerification)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/forgot-password").post(userForgotPasswordValidator(), validate, forgotPasswordRequest)
router.route("/verify-forgot-otp").post(verifyForgotPasswordOTP) // New route
router.route("/reset-password").post(userResetForgotPasswordValidator(), validate, resetForgotPassword) // Changed from /:resetToken

// Team invitation routes (public)
router.route("/verify-token").post(verifyResetToken)
router.route("/set-password").post(setPassword)



// secured routes(for logedin user)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.route("/change-password").post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changeCurrentPassword)
router.route("/users").get(verifyJWT, getUsersByRole)
router.route("/upload-avatar").post(verifyJWT, upload.single('avatar'), uploadAvatar)
router.route("/update-profile").patch(verifyJWT, updateProfile)


export default router