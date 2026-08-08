import { Router } from "express";
import multer from "multer";
import { uploadAndProcessPdf } from "../controllers/aiController.js";
import { verifyJWT } from "../middlewares/auth_middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// Configure multer for memory storage so we don't save to disk needlessly
const storage = multer.memoryStorage();

// File filter to ensure it's a PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Not a PDF file! Please upload only PDFs."), false);
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limit size to 10MB (optional but good practice)
    }
});

// Route for processing PDF (requires a file to be sent with the form-data key "file")
//
// Middleware order is deliberate: authenticate and rate-limit BEFORE multer, so
// an unauthenticated or throttled request is rejected without buffering a 10 MB
// upload into memory or reaching the (paid) Groq call downstream.
router.post(
    "/process-pdf",
    verifyJWT,
    apiLimiter,
    upload.single("file"),
    uploadAndProcessPdf
);

export default router;
