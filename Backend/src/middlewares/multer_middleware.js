import multer from "multer"
import fs from "fs"
import path from "path"

const UPLOAD_DIR = "./public/images"

// Ensure upload directory always exists before multer tries to write
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, UPLOAD_DIR)
    },
    filename: function(req, file, callback) {
        const ext = path.extname(file.originalname)
        callback(null, `${Date.now()}-avatar${ext}`)
    }
})

export const upload = multer({ storage })