// Generic middleware factory: wraps any Zod schema and validates req.body
// against it before the request reaches the controller. Reused for every
// resource's create/update routes (Product here, Order/Store later).
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const err = new Error(
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
    );
    err.statusCode = 400;
    return next(err);
  }

  // Replace req.body with the parsed/coerced data (e.g. numeric strings
  // turned into real numbers) so the controller can trust its shape.
  req.body = result.data;
  next();
};

module.exports = validate;
