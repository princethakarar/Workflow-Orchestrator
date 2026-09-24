import multer from "multer"

// Use memory storage — Vercel's filesystem is read-only (only /tmp is writable
// and is not persistent across invocations), so we must never touch the disk.
// Files land in req.file.buffer and are streamed directly to Cloudinary.
const storage = multer.memoryStorage()

export const upload = multer({
    storage,
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
})