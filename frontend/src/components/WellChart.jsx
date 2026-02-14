import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const WellChart = ({ data, curves, depthRange, zones, fluidIndicators }) => {
  const plotData = useMemo(() => {
    if (!data || !data.depth) return [];

    const traces = [];

    // Create a trace for each curve
    const curveTraces = curves.map((curveName, index) => {
      const colors = [
        '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b',
        '#10b981', '#ef4444', '#6366f1', '#14b8a6'
      ];

      return {
        x: data[curveName] || [],
        y: data.depth || [],
        type: 'scatter',
        mode: 'lines',
        name: curveName,
        line: {
          color: colors[index % colors.length],
          width: 2,
        },
        hovertemplate:
          `<b>${curveName}</b><br>` +
          'Depth: %{y:.2f} ft<br>' +
          'Value: %{x:.2f}<br>' +
          '<extra></extra>',
      };
    });

    traces.push(...curveTraces);

    // Add gas show markers if available
    if (fluidIndicators && fluidIndicators.hasGasData && fluidIndicators.gasShows) {
      const gasShowDepths = fluidIndicators.gasShows.map(show => show.depth);
      const gasShowValues = fluidIndicators.gasShows.map(show => show.totalGas);

      // Create marker trace for gas shows
      traces.push({
        x: gasShowValues,
        y: gasShowDepths,
        type: 'scatter',
        mode: 'markers',
        name: '⚡ Gas Shows',
        marker: {
          color: fluidIndicators.gasShows.map(show =>
            show.severity === 'high' ? '#dc2626' :
              show.severity === 'medium' ? '#f59e0b' : '#fbbf24'
          ),
          size: fluidIndicators.gasShows.map(show =>
            show.severity === 'high' ? 14 :
              show.severity === 'medium' ? 12 : 10
          ),
          symbol: 'star',
          line: {
            color: '#16a34a',
            width: 2
          }
        },
        hovertemplate:
          '<b>⚡ Gas Show</b><br>' +
          'Depth: %{y:.2f} ft<br>' +
          'Total Gas: %{x:.2f}<br>' +
          '<extra></extra>',
        showlegend: true,
      });
    }

    return traces;
  }, [data, curves, fluidIndicators]);

  const layout = useMemo(() => {
    const baseLayout = {
      title: {
        text: 'Well Log Visualization',
        font: { size: 20, weight: 'bold' },
      },
      showlegend: true,
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1,
      },
      xaxis: {
        title: 'Measurement Value',
        gridcolor: '#e5e7eb',
      },
      yaxis: {
        title: 'Depth (ft)',
        autorange: 'reversed', // Depth increases downward (geological convention)
        gridcolor: '#e5e7eb',
      },
      hovermode: 'closest',
      plot_bgcolor: '#f9fafb',
      paper_bgcolor: 'white',
      margin: { l: 80, r: 40, t: 80, b: 60 },
      autosize: true,
      shapes: [],
      annotations: [],
    };

    // Add zone backgrounds if available
    if (zones && zones.length > 1) {
      baseLayout.shapes = zones.map((zone, index) => {
        // Determine color based on characterization
        let fillcolor = 'rgba(200, 200, 200, 0.1)'; // Default gray

        if (zone.characterization.includes('Shaly')) {
          fillcolor = index % 2 === 0 ? 'rgba(156, 163, 175, 0.15)' : 'rgba(156, 163, 175, 0.08)';
        } else if (zone.characterization.includes('Clean')) {
          fillcolor = index % 2 === 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.06)';
        } else if (zone.characterization.includes('Mixed')) {
          fillcolor = index % 2 === 0 ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.06)';
        } else {
          fillcolor = index % 2 === 0 ? 'rgba(200, 200, 200, 0.12)' : 'rgba(200, 200, 200, 0.06)';
        }

        return {
          type: 'rect',
          xref: 'paper',
          yref: 'y',
          x0: 0,
          x1: 1,
          y0: zone.depthRange.start,
          y1: zone.depthRange.end,
          fillcolor: fillcolor,
          line: {
            width: 0
          },
          layer: 'below'
        };
      });

      // Add zone labels
      baseLayout.annotations = zones.map((zone) => ({
        xref: 'paper',
        yref: 'y',
        x: 0.02,
        y: (zone.depthRange.start + zone.depthRange.end) / 2,
        text: `Zone ${zone.id}<br>${zone.characterization}`,
        showarrow: false,
        font: {
          size: 10,
          color: '#6b7280'
        },
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        bordercolor: '#d1d5db',
        borderwidth: 1,
        borderpad: 4,
        align: 'left'
      }));
    }

    // Add gas zone highlights if available
    if (fluidIndicators && fluidIndicators.hasGasData && fluidIndicators.gasZones) {
      fluidIndicators.gasZones.forEach((gasZone) => {
        // Parse depth range (format: "8666.0-8679.0 ft")
        const depthMatch = gasZone.depthRange.match(/([\d.]+)-([\d.]+)/);
        if (depthMatch) {
          const start = parseFloat(depthMatch[1]);
          const end = parseFloat(depthMatch[2]);

          // Add green highlight for gas zones
          baseLayout.shapes.push({
            type: 'rect',
            xref: 'paper',
            yref: 'y',
            x0: 0,
            x1: 1,
            y0: start,
            y1: end,
            fillcolor: 'rgba(34, 197, 94, 0.15)',
            line: {
              color: 'rgba(34, 197, 94, 0.5)',
              width: 2,
              dash: 'dot'
            },
            layer: 'below'
          });

          // Add gas zone label
          baseLayout.annotations.push({
            xref: 'paper',
            yref: 'y',
            x: 0.98,
            y: (start + end) / 2,
            text: `⚡ Gas Zone<br>${gasZone.thickness} ft`,
            showarrow: false,
            font: {
              size: 10,
              color: '#16a34a',
              weight: 'bold'
            },
            bgcolor: 'rgba(220, 252, 231, 0.9)',
            bordercolor: '#16a34a',
            borderwidth: 2,
            borderpad: 4,
            align: 'right'
          });
        }
      });
    }

    return baseLayout;
  }, [zones, fluidIndicators]);

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'well_log_chart',
      height: 1000,
      width: 1400,
      scale: 2,
    },
  };

  if (!data || !data.depth || data.depth.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">
          Select curves and depth range to visualize data
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Chart Legend Info */}
      {(zones?.length > 1 || fluidIndicators?.hasGasData) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-2">
            📊 Enhanced Visualization:
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-blue-800">
            {zones?.length > 1 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
                <span>Geological zones (alternating backgrounds)</span>
              </div>
            )}
            {fluidIndicators?.hasGasData && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                  <span>Gas zones (green highlights)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <span>Gas shows (star markers)</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '700px' }}
        useResizeHandler={true}
      />

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-gray-600">Depth Points</p>
          <p className="text-lg font-semibold">{data.depth.length}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-gray-600">Depth Range</p>
          <p className="text-lg font-semibold">
            {Math.min(...data.depth).toFixed(1)} - {Math.max(...data.depth).toFixed(1)} ft
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-gray-600">Curves Displayed</p>
          <p className="text-lg font-semibold">{curves.length}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-gray-600">Total Data Points</p>
          <p className="text-lg font-semibold">
            {(data.depth.length * curves.length).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Enhanced Stats */}
      {(zones?.length > 1 || fluidIndicators?.hasGasData) && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {zones?.length > 1 && (
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <p className="text-purple-600 font-medium">Zones Identified</p>
              <p className="text-2xl font-bold text-purple-700">{zones.length}</p>
            </div>
          )}
          {fluidIndicators?.hasGasData && (
            <>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-green-600 font-medium">Gas Shows</p>
                <p className="text-2xl font-bold text-green-700">
                  {fluidIndicators.summary.totalGasShows}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-green-600 font-medium">Peak Gas</p>
                <p className="text-2xl font-bold text-green-700">
                  {fluidIndicators.summary.maxGasValue.toFixed(1)}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WellChart;