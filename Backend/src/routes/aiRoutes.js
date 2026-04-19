import { Router } from "express";
import multer from "multer";
import { uploadAndProcessPdf } from "../controllers/aiController.js";

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
router.post("/process-pdf", upload.single("file"), uploadAndProcessPdf);

export default router;
