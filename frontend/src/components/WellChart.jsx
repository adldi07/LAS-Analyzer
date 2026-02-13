import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const WellChart = ({ data, curves, depthRange }) => {
  const plotData = useMemo(() => {
    if (!data || !data.depth) return [];

    // Create a trace for each curve
    return curves.map((curveName, index) => {
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
  }, [data, curves]);

  const layout = useMemo(() => ({
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
  }), []);

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
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '600px' }}
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
    </div>
  );
};

export default WellChart;