const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const wellService = require('../services/wellService');

const router = express.Router();

/**
 * GET /api/wells/:wellId/data
 * Get measurement data for visualization
 * 
 * Query params:
 * - curves: comma-separated curve mnemonics (e.g., "GR,RHOB,NPHI")
 * - depthStart: starting depth
 * - depthStop: ending depth
 */
router.get('/:wellId/data', asyncHandler(async (req, res) => {
  const { wellId } = req.params;
  const { curves, depthStart, depthStop } = req.query;

  // Validation
  if (!curves || !depthStart || !depthStop) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Missing required parameters: curves, depthStart, depthStop',
        example: '/api/wells/{wellId}/data?curves=GR,RHOB&depthStart=1000&depthStop=2000'
      },
    });
  }

  // Parse curve names
  const curveMnemonics = curves.split(',').map(c => c.trim());

  if (curveMnemonics.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'At least one curve must be specified' },
    });
  }

  // Parse depth values
  const start = parseFloat(depthStart);
  const stop = parseFloat(depthStop);

  if (isNaN(start) || isNaN(stop)) {
    return res.status(400).json({
      success: false,
      error: { message: 'depthStart and depthStop must be valid numbers' },
    });
  }

  if (start >= stop) {
    return res.status(400).json({
      success: false,
      error: { message: 'depthStart must be less than depthStop' },
    });
  }

  // Fetch data
  const data = await wellService.getMeasurements(
    wellId,
    curveMnemonics,
    start,
    stop
  );

  res.json({
    success: true,
    data: data,
    metadata: {
      wellId: wellId,
      curves: curveMnemonics,
      depthRange: {
        start: start,
        stop: stop,
      },
      pointCount: data.depth ? data.depth.length : 0,
    },
  });
}));

module.exports = router;