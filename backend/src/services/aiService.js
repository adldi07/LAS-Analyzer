const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

class AIService {
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
   * Generate AI interpretation using Claude
   */
  async interpretWellData(wellInfo, curves, depthRange, data, stats, anomalies, correlations) {
    const prompt = this.buildInterpretationPrompt(
      wellInfo,
      curves,
      depthRange,
      stats,
      anomalies,
      correlations
    );

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const interpretation = message.content[0].text;

      return {
        interpretation,
        statistics: stats,
        anomalies,
        correlations,
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
   * Build prompt for Claude
   */
  buildInterpretationPrompt(wellInfo, curves, depthRange, stats, anomalies, correlations) {
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

        TASK:
        Provide a comprehensive interpretation including:

        1. **Overall Assessment**: What does this depth interval represent? Any indications of lithology, fluid content, or reservoir quality?

        2. **Key Patterns & Trends**: Describe significant patterns in the data.

        3. **Anomalies & Points of Interest**: Explain the anomalies detected and their potential geological significance.

        4. **Correlations**: Interpret the correlations found between curves.

        5. **Recommendations**: Suggest any additional analysis or considerations.

        Be specific, reference actual depth values and measurements, and use professional geological terminology where appropriate. Keep the interpretation practical and actionable.`;
        }

  /**
   * Chat with well data context
   */
  async chatWithWellData(wellInfo, conversation, wellContext) {
    const systemPrompt = `You are a geoscience AI assistant helping analyze well-log data for ${wellInfo.well_name || 'a well'}. 

        WELL CONTEXT:
        ${JSON.stringify(wellContext, null, 2)}

        Answer questions about this well data conversationally, referencing specific measurements and depths when relevant. Be helpful and educational.`;

    try {
      const messages = [
        {
          role: 'user',
          content: systemPrompt,
        },
        ...conversation,
      ];

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: messages,
      });

      return message.content[0].text;
    } catch (error) {
      console.error('Claude chat error:', error);
      throw new Error('Chat failed');
    }
  }
}

module.exports = new AIService();