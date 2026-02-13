const express = require('express');
const pool = require('../config/database');
const aiService = require('../services/aiService');
const wellService = require('../services/wellService');

const router = express.Router();

/**
 * POST /api/wells/:wellId/interpret
 * Generate AI interpretation
 */
router.post('/:wellId/interpret', async (req, res, next) => {
  try {
    const { wellId } = req.params;
    const { curves, depthStart, depthStop } = req.body;

    if (!curves || !Array.isArray(curves) || curves.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'curves array is required' },
      });
    }

    if (!depthStart || !depthStop) {
      return res.status(400).json({
        success: false,
        error: { message: 'depthStart and depthStop are required' },
      });
    }

    // Get well info
    const well = await wellService.getWell(wellId);

    // Get measurement data
    const data = await wellService.getMeasurements(
      wellId,
      curves,
      depthStart,
      depthStop
    );

    // Calculate statistics
    const stats = aiService.calculateStatistics(data, curves);

    // Find anomalies
    const anomalies = aiService.findAnomalies(data, curves, stats);

    // Calculate correlations
    const correlations = aiService.calculateCorrelations(data, curves);

    // Generate AI interpretation
    const result = await aiService.interpretWellData(
      well,
      curves,
      { start: depthStart, stop: depthStop },
      data,
      stats,
      anomalies,
      correlations
    );

    // Store interpretation in database
    await pool.query(
      `INSERT INTO interpretations 
       (well_id, depth_start, depth_stop, curves_analyzed, interpretation_text, statistics, insights)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        wellId,
        depthStart,
        depthStop,
        curves,
        result.interpretation,
        JSON.stringify(result.statistics),
        JSON.stringify({ anomalies: result.anomalies, correlations: result.correlations }),
      ]
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wells/:wellId/chat
 * Chatbot interaction
 */
router.post('/:wellId/chat', async (req, res, next) => {
  try {
    const { wellId } = req.params;
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: { message: 'message is required' },
      });
    }

    // Get well info and curves
    const well = await wellService.getWell(wellId);

    // Build context
    const wellContext = {
      well_name: well.well_name,
      field: well.field_name,
      depth_range: `${well.start_depth} - ${well.stop_depth} ft`,
      curves: well.curves.map(c => c.mnemonic).join(', '),
    };

    // Format conversation
    const conversation = [
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Get AI response
    const response = await aiService.chatWithWellData(
      well,
      conversation,
      wellContext
    );

    // Store in database
    await pool.query(
      `INSERT INTO chat_messages (well_id, role, content) VALUES ($1, $2, $3)`,
      [wellId, 'user', message]
    );

    await pool.query(
      `INSERT INTO chat_messages (well_id, role, content) VALUES ($1, $2, $3)`,
      [wellId, 'assistant', response]
    );

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;