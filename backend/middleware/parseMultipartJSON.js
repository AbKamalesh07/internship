// multipart/form-data can only carry strings and files — never nested
// JSON. So when the client sends a product's `variants` array alongside
// image files, it has to be sent as a JSON *string* field. This
// middleware parses those specific fields back into real objects/arrays
// before the request reaches Zod validation.
//
// Must run AFTER multer (so req.body is populated) and BEFORE validate().
const JSON_FIELDS = ["variants", "images"];

const parseMultipartJSON = (req, res, next) => {
  for (const field of JSON_FIELDS) {
    if (typeof req.body[field] === "string" && req.body[field].trim() !== "") {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (e) {
        const err = new Error(`Field "${field}" must be valid JSON`);
        err.statusCode = 400;
        return next(err);
      }
    }
  }
  next();
};

module.exports = parseMultipartJSON;
