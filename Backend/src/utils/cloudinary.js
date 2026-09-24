import { v2 as cloudinary } from "cloudinary"

// Configure once at module load — credentials come from Vercel env vars.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * uploadBufferToCloudinary
 * Uploads a Buffer directly to Cloudinary without touching the filesystem.
 *
 * @param {Buffer} buffer  - File contents as a Node.js Buffer (req.file.buffer)
 * @param {string} folder  - Cloudinary folder to place the asset in
 * @returns {Promise<object>} Cloudinary upload result (contains .secure_url, .public_id, …)
 */
export function uploadBufferToCloudinary(buffer, folder = "uploads") {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "auto" },
            (error, result) => {
                if (error) return reject(error)
                resolve(result)
            }
        )
        stream.end(buffer)
    })
}

/**
 * deleteFromCloudinary
 * Removes an asset from Cloudinary by its public_id.
 *
 * @param {string} publicId - The public_id returned by a previous upload
 * @returns {Promise<object>} Cloudinary deletion result
 */
export async function deleteFromCloudinary(publicId) {
    return cloudinary.uploader.destroy(publicId)
}
