const cloudinary = require("../config/cloudinary");

// Wraps Cloudinary's upload_stream (callback-based) in a Promise so it can
// be awaited alongside the rest of the async controller code.
const streamUpload = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Uploads every file in a Multer req.files array in parallel and returns
// their secure_url strings, in the same order they were uploaded.
const uploadImages = async (files, folder) => {
  const uploads = files.map((file) => streamUpload(file.buffer, folder));
  const results = await Promise.all(uploads);
  return results.map((r) => r.secure_url);
};

module.exports = { uploadImages, streamUpload };
