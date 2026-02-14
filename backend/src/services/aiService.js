const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../config/database');

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

class AIService {
  /**
   * Generate system prompt with well context for chatbot
   */
  async generateSystemPrompt(wellId) {
    try {
      // Query well metadata
      const wellResult = await pool.query(
        `SELECT id, well_name, field_name, company, 
                start_depth, stop_depth, step, depth_unit, 
                header_info, uploaded_at
         FROM wells 
         WHERE id = $1`,
        [wellId]
      );

      if (wellResult.rows.length === 0) {
        throw new Error('Well not found');
      }

      const well = wellResult.rows[0];

      // Query curve statistics
      const curvesResult = await pool.query(
        `SELECT mnemonic, curve_name, unit, description,
                min_value, max_value, mean_value
         FROM curves 
         WHERE well_id = $1
         ORDER BY mnemonic`,
        [wellId]
      );

      const curves = curvesResult.rows;

      // Build comprehensive system prompt
      const systemPrompt = `You are an expert petrophysicist and well log analyst assistant. You are analyzing well log data for the following well:

**Well Information:**
- Well Name: ${well.well_name || 'Unknown'}
- Field: ${well.field_name || 'Not specified'}
- Company: ${well.company || 'Not specified'}
- Depth Range: ${well.start_depth} to ${well.stop_depth} ${well.depth_unit}
- Step: ${well.step} ${well.depth_unit}
- Upload Date: ${new Date(well.uploaded_at).toLocaleDateString()}

**Available Curves and Statistics:**
${curves.map(curve => `
- **${curve.mnemonic}** (${curve.curve_name || 'N/A'})
  - Unit: ${curve.unit || 'N/A'}
  - Description: ${curve.description || 'N/A'}
  - Range: ${curve.min_value?.toFixed(2) || 'N/A'} to ${curve.max_value?.toFixed(2) || 'N/A'}
  - Average: ${curve.mean_value?.toFixed(2) || 'N/A'}
`).join('')}

**Your Role:**
- Answer questions about this specific well's data
- Provide petrophysical interpretations based on the curve values
- Explain log responses and what they indicate about the formation
- Help identify zones of interest (e.g., pay zones, shale, sandstone)
- Be concise but informative
- If asked about data not available in the curves above, politely state that information is not available

**Guidelines:**
- Always reference specific curve values when making interpretations
- Use standard petrophysical terminology
- Be precise with numbers and units
- If uncertain, acknowledge limitations rather than speculate
- Suggest relevant follow-up analyses when appropriate`;

      return systemPrompt;
    } catch (error) {
      console.error('Error generating system prompt:', error);
      throw new Error('Failed to generate chat context');
    }
  }

  /**
   * Calculate statistics for the data
   */
  calculateStatistics(data, curves) {
    const stats = {};

    for (const curve of curves) {
      const values = data[curve].filter(v => v !== null && v !== undefined);

      if (values.length === 0) {
        stats[curve] = null;
        continue;
      }

      const sorted = [...values].sort((a, b) => a - b);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

      stats[curve] = {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: mean,
        median: sorted[Math.floor(sorted.length / 2)],
        stdDev: Math.sqrt(variance),
        count: values.length,
      };
    }

    return stats;
  }

  /**
   * Find anomalies (values beyond 2 standard deviations)
   */
  findAnomalies(data, curves, stats) {
    const anomalies = [];

    for (const curve of curves) {
      if (!stats[curve]) continue;

      const { mean, stdDev } = stats[curve];
      const threshold = 2 * stdDev;

      data.depth.forEach((depth, index) => {
        const value = data[curve][index];

        if (value !== null && Math.abs(value - mean) > threshold) {
          anomalies.push({
            curve,
            depth,
            value,
            deviation: Math.abs(value - mean) / stdDev,
          });
        }
      });
    }

    return anomalies.sort((a, b) => b.deviation - a.deviation).slice(0, 10);
  }

  /**
   * Calculate correlations between curves
   */
  calculateCorrelations(data, curves) {
    const correlations = [];

    for (let i = 0; i < curves.length; i++) {
      for (let j = i + 1; j < curves.length; j++) {
        const curve1 = curves[i];
        const curve2 = curves[j];

        const correlation = this.pearsonCorrelation(
          data[curve1],
          data[curve2]
        );

        if (Math.abs(correlation) > 0.5) {
          correlations.push({
            curve1,
            curve2,
            correlation,
          });
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Pearson correlation coefficient
   */
  pearsonCorrelation(x, y) {
    const n = Math.min(x.length, y.length);

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    let count = 0;

    for (let i = 0; i < n; i++) {
      if (x[i] === null || y[i] === null) continue;

      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
      count++;
    }

    if (count === 0) return 0;

    const numerator = count * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (count * sumX2 - sumX * sumX) * (count * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * TIER 1 ADVANCED INTERPRETATION: Detect fluid type indicators
   * Leverages TOTAL_GAS and HC1-HC10 curves if available
   */
  detectFluidIndicators(data, curves) {
    const indicators = {
      hasGasData: false,
      gasShows: [],
      gasZones: [],
      gasComposition: [],
      summary: {}
    };

    // Check if gas curves exist
    const gasCurves = curves.filter(c =>
      c.toUpperCase().includes('GAS') ||
      c.toUpperCase().includes('HC') ||
      c === 'C1' || c === 'C2' || c === 'C3' || c === 'C4' || c === 'C5'
    );

    if (gasCurves.length === 0) {
      return indicators;
    }

    indicators.hasGasData = true;

    // Analyze TOTAL_GAS if available
    const totalGasCurve = curves.find(c => c.toUpperCase().includes('TOTAL') && c.toUpperCase().includes('GAS'));

    if (totalGasCurve && data[totalGasCurve]) {
      data.depth.forEach((depth, i) => {
        const gasValue = data[totalGasCurve][i];

        if (gasValue !== null && gasValue > 100) {
          indicators.gasShows.push({
            depth: depth,
            totalGas: gasValue,
            severity: gasValue > 500 ? 'high' : gasValue > 200 ? 'medium' : 'low'
          });
        }
      });
    }

    // Analyze HC components (C1/C2 ratio indicates gas type)
    const hc1Curve = curves.find(c => c === 'HC1' || c === 'C1');
    const hc2Curve = curves.find(c => c === 'HC2' || c === 'C2');

    if (hc1Curve && hc2Curve && data[hc1Curve] && data[hc2Curve]) {
      data.depth.forEach((depth, i) => {
        const c1 = data[hc1Curve][i];
        const c2 = data[hc2Curve][i];

        if (c1 !== null && c2 !== null && c2 !== 0 && c1 > 1000) {
          const ratio = c1 / c2;
          indicators.gasComposition.push({
            depth: depth,
            c1: c1,
            c2: c2,
            ratio: ratio,
            interpretation: ratio > 10 ? 'Dry gas' : ratio > 5 ? 'Wet gas' : 'Oil/condensate'
          });
        }
      });
    }

    // Group nearby shows into continuous zones
    if (indicators.gasShows.length > 0) {
      indicators.gasZones = this.identifyGasZones(indicators.gasShows, 5);
    }

    // Summary statistics
    indicators.summary = {
      totalGasShows: indicators.gasShows.length,
      maxGasValue: indicators.gasShows.length > 0
        ? Math.max(...indicators.gasShows.map(s => s.totalGas))
        : 0,
      gasZoneCount: indicators.gasZones.length,
      depthsOfInterest: indicators.gasShows
        .filter(s => s.severity === 'high')
        .map(s => s.depth),
      hasCompositionData: indicators.gasComposition.length > 0
    };

    return indicators;
  }

  /**
   * Helper: Group nearby gas shows into continuous zones
   */
  identifyGasZones(shows, maxGap) {
    if (shows.length === 0) return [];

    const sortedShows = [...shows].sort((a, b) => a.depth - b.depth);

    const zones = [];
    let currentZone = {
      start: sortedShows[0].depth,
      end: sortedShows[0].depth,
      shows: [sortedShows[0]]
    };

    for (let i = 1; i < sortedShows.length; i++) {
      if (sortedShows[i].depth - currentZone.end <= maxGap) {
        currentZone.end = sortedShows[i].depth;
        currentZone.shows.push(sortedShows[i]);
      } else {
        zones.push(currentZone);
        currentZone = {
          start: sortedShows[i].depth,
          end: sortedShows[i].depth,
          shows: [sortedShows[i]]
        };
      }
    }
    zones.push(currentZone);

    return zones.map(z => ({
      depthRange: `${z.start.toFixed(1)}-${z.end.toFixed(1)} ft`,
      thickness: (z.end - z.start).toFixed(1),
      avgGas: (z.shows.reduce((sum, s) => sum + s.totalGas, 0) / z.shows.length).toFixed(1),
      peakGas: Math.max(...z.shows.map(s => s.totalGas)).toFixed(1),
      showCount: z.shows.length
    }));
  }

  /**
   * TIER 1 ADVANCED INTERPRETATION: Data quality control
   * Flags potential issues with the well-log data
   */
  performQualityControl(data, curves, stats) {
    const issues = {
      warnings: [],
      errors: [],
      summary: { totalIssues: 0, severity: 'none' }
    };

    const expectedRanges = {
      'GR': { min: 0, max: 500, unit: 'API' },
      'RHOB': { min: 1.5, max: 3.5, unit: 'g/cc' },
      'NPHI': { min: -0.15, max: 1.0, unit: 'v/v' },
      'DT': { min: 40, max: 200, unit: 'us/ft' },
      'RT': { min: 0.1, max: 10000, unit: 'ohm.m' },
      'CALI': { min: 4, max: 20, unit: 'in' }
    };

    curves.forEach(curve => {
      const values = data[curve];
      const stat = stats[curve];

      if (!stat || !values) return;

      // 1. Check for impossible values
      if (expectedRanges[curve]) {
        const { min, max, unit } = expectedRanges[curve];
        const outOfRange = values.filter(v => v !== null && (v < min || v > max));

        if (outOfRange.length > 0) {
          const percentage = (outOfRange.length / values.length) * 100;
          issues.warnings.push({
            type: 'OUT_OF_RANGE',
            curve,
            message: `${outOfRange.length} values (${percentage.toFixed(1)}%) outside expected range (${min}-${max} ${unit})`,
            severity: percentage > 10 ? 'high' : percentage > 5 ? 'medium' : 'low'
          });
        }
      }

      // 2. Check for stuck tool
      let maxStuckCount = 0;
      let currentStuckCount = 1;
      let stuckValue = null;
      let stuckDepth = null;

      for (let i = 1; i < values.length; i++) {
        if (values[i] !== null && values[i] === values[i - 1]) {
          if (currentStuckCount === 1) {
            stuckValue = values[i];
            stuckDepth = data.depth[i - 1];
          }
          currentStuckCount++;
          maxStuckCount = Math.max(maxStuckCount, currentStuckCount);
        } else {
          currentStuckCount = 1;
        }
      }

      if (maxStuckCount > 10) {
        issues.warnings.push({
          type: 'STUCK_TOOL',
          curve,
          message: `Tool appears stuck (${maxStuckCount} identical values near ${stuckDepth?.toFixed(1)} ft)`,
          severity: maxStuckCount > 20 ? 'high' : 'medium'
        });
      }

      // 3. Check for excessive nulls
      const nullCount = values.filter(v => v === null || v === undefined || isNaN(v)).length;
      const nullPercent = (nullCount / values.length) * 100;

      if (nullPercent > 10) {
        issues.warnings.push({
          type: 'MISSING_DATA',
          curve,
          message: `${nullPercent.toFixed(1)}% missing data`,
          severity: nullPercent > 30 ? 'high' : nullPercent > 20 ? 'medium' : 'low'
        });
      }

      // 4. Check for negative values where impossible
      const negativeNotAllowed = ['GR', 'RHOB', 'RT', 'CALI', 'TOTAL_GAS'];
      if (negativeNotAllowed.some(c => curve.includes(c))) {
        const negativeCount = values.filter(v => v !== null && v < 0).length;

        if (negativeCount > 0) {
          issues.errors.push({
            type: 'NEGATIVE_VALUES',
            curve,
            message: `${negativeCount} negative values detected (impossible for ${curve})`,
            severity: 'high'
          });
        }
      }
    });

    // Calculate summary
    issues.summary.totalIssues = issues.warnings.length + issues.errors.length;

    if (issues.errors.length > 0) {
      issues.summary.severity = 'high';
    } else if (issues.warnings.some(w => w.severity === 'high')) {
      issues.summary.severity = 'high';
    } else if (issues.warnings.some(w => w.severity === 'medium')) {
      issues.summary.severity = 'medium';
    } else if (issues.warnings.length > 0) {
      issues.summary.severity = 'low';
    }

    return issues;
  }

  /**
   * TIER 1 ADVANCED INTERPRETATION: Zone segmentation
   * Automatically divides well into distinct geological zones
   */
  segmentIntoZones(data, curves, stats, minZoneThickness = 10) {
    if (!data.depth || data.depth.length < minZoneThickness) {
      return [];
    }

    const primaryCurve = curves.includes('GR') ? 'GR' : curves[0];
    const values = data[primaryCurve];

    if (!values || !stats[primaryCurve]) {
      return [];
    }

    const windowSize = 5;
    const smoothed = this.movingAverage(values, windowSize);
    const changePoints = [0];
    const threshold = stats[primaryCurve].stdDev * 0.5;

    for (let i = windowSize; i < smoothed.length - windowSize; i++) {
      const derivative = Math.abs(smoothed[i + windowSize] - smoothed[i - windowSize]);

      if (derivative > threshold) {
        const lastChangeIdx = changePoints[changePoints.length - 1];
        if (i - lastChangeIdx >= minZoneThickness) {
          changePoints.push(i);
        }
      }
    }
    changePoints.push(data.depth.length - 1);

    const zones = [];
    for (let i = 0; i < changePoints.length - 1; i++) {
      const startIdx = changePoints[i];
      const endIdx = changePoints[i + 1];

      const zoneStats = {};
      curves.forEach(curve => {
        const zoneValues = data[curve].slice(startIdx, endIdx).filter(v => v !== null);
        if (zoneValues.length > 0) {
          zoneStats[curve] = {
            mean: zoneValues.reduce((a, b) => a + b, 0) / zoneValues.length,
            min: Math.min(...zoneValues),
            max: Math.max(...zoneValues)
          };
        }
      });

      zones.push({
        id: i + 1,
        depthRange: {
          start: data.depth[startIdx],
          end: data.depth[endIdx]
        },
        thickness: data.depth[endIdx] - data.depth[startIdx],
        statistics: zoneStats,
        characterization: this.characterizeZone(zoneStats)
      });
    }

    return zones;
  }

  /**
   * Helper: Calculate moving average
   */
  movingAverage(values, windowSize) {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
      const window = values.slice(start, end).filter(v => v !== null);

      if (window.length > 0) {
        result.push(window.reduce((a, b) => a + b, 0) / window.length);
      } else {
        result.push(null);
      }
    }
    return result;
  }

  /**
   * Helper: Characterize zone based on statistics
   */
  characterizeZone(stats) {
    if (stats.GR) {
      const grMean = stats.GR.mean;
      if (grMean > 100) return 'Shaly interval';
      if (grMean < 60) return 'Clean sand/carbonate';
      return 'Mixed lithology';
    }
    return 'Unclassified';
  }

  /**
   * Generate AI interpretation using Claude with advanced analyses
   */
  async interpretWellData(wellInfo, curves, depthRange, data, stats, anomalies, correlations) {
    // Run all Tier 1 advanced analyses
    const fluidIndicators = this.detectFluidIndicators(data, curves);
    const qualityIssues = this.performQualityControl(data, curves, stats);
    const zones = this.segmentIntoZones(data, curves, stats);

    const prompt = this.buildInterpretationPrompt(
      wellInfo,
      curves,
      depthRange,
      stats,
      anomalies,
      correlations,
      fluidIndicators,
      qualityIssues,
      zones
    );

    try {
      // --- MOCK MODE ENABLED (Save Costs) ---
      console.log('⚠️ MOCK MODE: Returning canned interpretation to save API costs');
      const interpretation = `
# 🧪 MOCK INTERPRETATION (Cost-Saving Mode)

**Note:** This is a generated response for testing purposes. The statistics, zones, and fluid indicators shown above are REAL calculations from your data, but this text analysis is a placeholder.

## 1. Overall Assessment
The analyzed interval (${depthRange.start}-${depthRange.stop} ft) represents a significant sequence of interest. The system has successfully segmented the log into distinct lithological zones, suggesting a changing depositional environment.

## 2. Hydrocarbon Potential
${fluidIndicators && fluidIndicators.hasGasData ? `**POSITIVE INDICATIONS:** The automated analysis has detected ${fluidIndicators.summary.totalGasShows} potential gas shows. The calculated C1/C2 ratios suggest a ${fluidIndicators.gasComposition?.[0]?.interpretation || 'productive'} gas system.` : 'No distinct hydrocarbon indicators were found in this specific interval.'}

## 3. Data Quality
The automated quality control checks have identified ${qualityIssues && qualityIssues.summary ? qualityIssues.summary.totalIssues : 0} issues. ${(qualityIssues && qualityIssues.summary && qualityIssues.summary.totalIssues > 0) ? 'Please review the warnings card above for specific tool sticking or calibration issues.' : 'The data quality appears excellent.'}

## 4. Lithology & Zonation
The interval has been divided into ${zones ? zones.length : 0} zones:
${zones && zones.length > 0 ? `- **Zone 1:** Shows characteristics of ${zones[0].characterization}.` : ''}
${zones && zones.length > 1 ? `- **Zone 2:** Transitions into a ${zones[1].characterization}.` : ''}

*To enable real AI analysis, uncomment the API call in backend/src/services/aiService.js*
      `;

      // const message = await anthropic.messages.create({
      //   model: 'claude-sonnet-4-20250514',
      //   max_tokens: 2000,
      //   messages: [{
      //     role: 'user',
      //     content: prompt,
      //   }],
      // });
      // const interpretation = message.content[0].text;

      return {
        interpretation,
        statistics: stats,
        anomalies,
        correlations,
        fluidIndicators,
        qualityIssues,
        zones,
        metadata: {
          model: 'claude-sonnet-4-20250514',
          timestamp: new Date().toISOString(),
          depthRange,
          curves,
        },
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('AI interpretation failed');
    }
  }

  /**
   * Build enhanced prompt for Claude with all advanced analyses
   */
  buildInterpretationPrompt(wellInfo, curves, depthRange, stats, anomalies, correlations, fluidIndicators, qualityIssues, zones) {
    return `You are an expert geoscience analyst specializing in well-log interpretation. Analyze the following well-log data and provide professional insights.

WELL INFORMATION:
- Well: ${wellInfo.well_name || 'Unknown'}
- Field: ${wellInfo.field_name || 'N/A'}
- Depth Interval: ${depthRange.start} to ${depthRange.stop} feet (${(depthRange.stop - depthRange.start).toFixed(1)} ft total)

CURVES ANALYZED:
${curves.join(', ')}

STATISTICAL SUMMARY:
${Object.entries(stats).map(([curve, stat]) => {
      if (!stat) return `${curve}: No data`;
      return `${curve}:
  - Range: ${stat.min.toFixed(2)} to ${stat.max.toFixed(2)}
  - Mean: ${stat.mean.toFixed(2)} ± ${stat.stdDev.toFixed(2)}
  - Median: ${stat.median.toFixed(2)}`;
    }).join('\n\n')}

${anomalies.length > 0 ? `
ANOMALIES DETECTED (beyond 2σ):
${anomalies.slice(0, 5).map(a =>
      `- ${a.curve} at ${a.depth.toFixed(1)} ft: ${a.value.toFixed(2)} (${a.deviation.toFixed(1)}σ)`
    ).join('\n')}
` : ''}

${correlations.length > 0 ? `
CORRELATIONS (|r| > 0.5):
${correlations.slice(0, 5).map(c =>
      `- ${c.curve1} vs ${c.curve2}: r = ${c.correlation.toFixed(3)}`
    ).join('\n')}
` : ''}

${zones && zones.length > 1 ? `
ZONE SEGMENTATION:
The interval has been divided into ${zones.length} distinct zones:

${zones.map(z => `
Zone ${z.id}: ${z.depthRange.start.toFixed(1)}-${z.depthRange.end.toFixed(1)} ft (${z.thickness.toFixed(1)} ft)
Characterization: ${z.characterization}
Key Statistics:
${Object.entries(z.statistics).slice(0, 3).map(([curve, stat]) =>
      `  - ${curve}: avg ${stat.mean.toFixed(2)} (range ${stat.min.toFixed(2)}-${stat.max.toFixed(2)})`
    ).join('\n')}`).join('\n')}

Interpret each zone and explain what the vertical sequence suggests about the depositional environment.
` : ''}

${fluidIndicators.hasGasData ? `
HYDROCARBON INDICATORS:
Gas Shows Detected: ${fluidIndicators.summary.totalGasShows}
Peak Gas Reading: ${fluidIndicators.summary.maxGasValue.toFixed(1)} units

Gas Zones Identified:
${fluidIndicators.gasZones.map(z =>
      `- ${z.depthRange}: ${z.thickness} ft thick, avg gas ${z.avgGas}, peak ${z.peakGas}`
    ).join('\n')}

${fluidIndicators.summary.hasCompositionData ? `
Gas Composition Analysis:
${fluidIndicators.gasComposition.slice(0, 3).map(gc =>
      `- ${gc.depth.toFixed(1)} ft: C1/C2 ratio = ${gc.ratio.toFixed(1)} (${gc.interpretation})`
    ).join('\n')}
` : ''}

CRITICAL: Assess the hydrocarbon potential of this interval. Are these commercial gas shows?
` : ''}

${qualityIssues.summary.totalIssues > 0 ? `
DATA QUALITY NOTES:
${qualityIssues.warnings.slice(0, 3).map(w => `- ${w.curve}: ${w.message}`).join('\n')}
${qualityIssues.errors.length > 0 ? `\nERRORS: ${qualityIssues.errors.map(e => e.message).join('; ')}` : ''}

Note: Consider data quality issues in your interpretation.
` : ''}

TASK:
Provide a comprehensive interpretation including:

1. **Overall Assessment**: What does this depth interval represent? Any indications of lithology, fluid content, or reservoir quality?

2. **Key Patterns & Trends**: Describe significant patterns in the data.

3. **Anomalies & Points of Interest**: Explain the anomalies detected and their potential geological significance.

4. **Correlations**: Interpret the correlations found between curves.

${fluidIndicators.hasGasData ? '5. **Hydrocarbon Potential**: Evaluate the gas shows and their commercial significance.\n\n6. ' : '5. '}**Recommendations**: Suggest any additional analysis or considerations.

Be specific, reference actual depth values and measurements, and use professional geological terminology where appropriate. Keep the interpretation practical and actionable.`;
  }

  /**
   * Chat with well data context
   * @param {Array} conversationHistory - Full conversation including system prompt
   */
  async chatWithWellData(conversationHistory) {
    try {
      // Separate system message from conversation
      const systemMessage = conversationHistory.find(msg => msg.role === 'system');
      const userMessages = conversationHistory.filter(msg => msg.role !== 'system');

      if (!systemMessage) {
        throw new Error('System prompt is required for chat');
      }

      // Claude API format: system goes in system parameter, not in messages
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemMessage.content,
        messages: userMessages,
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude chat error:', error);
      throw new Error('Chat failed: ' + (error.message || 'Unknown error'));
    }
  }
}

module.exports = new AIService();