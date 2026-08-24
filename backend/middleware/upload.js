const multer = require("multer");

// Memory storage — files never touch the local disk. Each file arrives
// as a Buffer in req.files[i].buffer, which the upload controller streams
// directly to Cloudinary. This matters on platforms like Render/Vercel
// where the filesystem is ephemeral/read-only.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILES_PER_UPLOAD = 8; // covers a product's main images + a handful of variant images

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const err = new Error(
      `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
    err.statusCode = 400;
    return cb(err);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES_PER_UPLOAD,
  },
});

module.exports = upload;
