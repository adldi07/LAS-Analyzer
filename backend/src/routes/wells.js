const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const wellService = require('../services/wellService');

const router = express.Router();


//// --------------------  will add error handler later ---------------------
//// --------------------  will add error handler later ---------------------
//// --------------------  will add error handler later ---------------------
//// --------------------  will add error handler later ---------------------
//// --------------------  will add error handler later ---------------------
//// --------------------  will add error handler later ---------------------

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.las')) {
      cb(null, true);
    } else {
      cb(new Error('Only .las files are allowed'));
    }
  },
});

/**
 * POST /api/wells
 * Upload and process LAS file
 */
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' },
      });
    }

    const wellId = uuidv4();
    
    const result = await wellService.processLASFile(req.file, wellId);

    res.status(201).json({
      success: true,
      data: {
        wellId: wellId,
        filename: req.file.originalname,
        curves: result.curves.map(c => ({
          mnemonic: c.mnemonic,
          unit: c.unit,
          description: c.description,
        })),
        depthRange: {
          start: result.well.start_depth,
          stop: result.well.stop_depth,
          step: result.well.step,
          unit: result.well.depth_unit,
        },
        measurementCount: result.measurementCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wells/:wellId
 * Get well metadata and curves
 */
router.get('/:wellId', async (req, res, next) => {
  try {
    const { wellId } = req.params;
    const well = await wellService.getWell(wellId);

    res.json({
      success: true,
      data: well,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wells/:wellId/data
 * Get measurement data
 */
router.get('/:wellId/data', async (req, res, next) => {
  try {
    const { wellId } = req.params;
    const { curves, depthStart, depthStop } = req.query;

    if (!curves || !depthStart || !depthStop) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required parameters: curves, depthStart, depthStop' },
      });
    }

    const curveMnemonics = curves.split(',');
    const data = await wellService.getMeasurements(
      wellId,
      curveMnemonics,
      parseFloat(depthStart),
      parseFloat(depthStop)
    );

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------


// ------------- this is error handler for this file -------------------- will add later 

// // backend/src/routes/wells.js
// const express = require('express');
// const multer = require('multer');
// const { v4: uuidv4 } = require('uuid');
// const wellService = require('../services/wellService');
// const { asyncHandler } = require('../middleware/errorHandler'); // Import

// const router = express.Router();

// // Configure multer
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 50 * 1024 * 1024, // 50MB
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.originalname.toLowerCase().endsWith('.las')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only .las files are allowed'));
//     }
//   },
// });

// /**
//  * POST /api/wells
//  * Upload and process LAS file
//  */
// router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       error: { message: 'No file uploaded' },
//     });
//   }

//   const wellId = uuidv4();
  
//   const result = await wellService.processLASFile(req.file, wellId);

//   res.status(201).json({
//     success: true,
//     data: {
//       wellId: wellId,
//       filename: req.file.originalname,
//       curves: result.curves.map(c => ({
//         mnemonic: c.mnemonic,
//         unit: c.unit,
//         description: c.description,
//       })),
//       depthRange: {
//         start: result.well.start_depth,
//         stop: result.well.stop_depth,
//         step: result.well.step,
//         unit: result.well.depth_unit,
//       },
//       measurementCount: result.measurementCount,
//     },
//   });
// }));

// /**
//  * GET /api/wells/:wellId
//  * Get well metadata and curves
//  */
// router.get('/:wellId', asyncHandler(async (req, res) => {
//   const { wellId } = req.params;
//   const well = await wellService.getWell(wellId);

//   res.json({
//     success: true,
//     data: well,
//   });
// }));

// /**
//  * GET /api/wells/:wellId/data
//  * Get measurement data
//  */
// router.get('/:wellId/data', asyncHandler(async (req, res) => {
//   const { wellId } = req.params;
//   const { curves, depthStart, depthStop } = req.query;

//   if (!curves || !depthStart || !depthStop) {
//     return res.status(400).json({
//       success: false,
//       error: { 
//         message: 'Missing required parameters: curves, depthStart, depthStop' 
//       },
//     });
//   }

//   const curveMnemonics = curves.split(',');
//   const data = await wellService.getMeasurements(
//     wellId,
//     curveMnemonics,
//     parseFloat(depthStart),
//     parseFloat(depthStop)
//   );

//   res.json({
//     success: true,
//     data: data,
//   });
// }));

// module.exports = router;