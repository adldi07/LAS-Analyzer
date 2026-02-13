const { z } = require('zod');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.errors,
        },
      });
    }
  };
};

// Example schemas
const interpretSchema = z.object({
  body: z.object({
    curves: z.array(z.string()).min(1),
    depthStart: z.number(),
    depthStop: z.number(),
  }),
  params: z.object({
    wellId: z.string().uuid(),
  }),
});

module.exports = { validateRequest, interpretSchema };