import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { BarChart2 } from 'lucide-react';

const WellChart = ({ data, curves, depthRange, zones, fluidIndicators }) => {
  // Define curve groups for track-based visualization
  const groups = useMemo(() => {
    const categories = {
      Lithology: ['GR', 'SP', 'CALI', 'BS', 'PEF', 'PHIE', 'PHIT'],
      Resistivity: ['ILD', 'ILM', 'LL3', 'LLD', 'LLS', 'SN', 'MSFL', 'RT', 'RES', 'RESISTIVITY'],
      Porosity: ['RHOB', 'NPHI', 'DT', 'DPHI', 'NPHI_LS'],
      Gas: ['GAS', 'TGAS', 'TOTAL_GAS', 'C1', 'C2', 'C3', 'IC4', 'NC4', 'IC5', 'NC5', 'HC'],
    };

    const categorized = {
      Lithology: [],
      Resistivity: [],
      Porosity: [],
      Gas: [],
      General: []
    };

    curves.forEach(curve => {
      const upper = curve.toUpperCase();
      let found = false;

      for (const [category, mnemonics] of Object.entries(categories)) {
        if (mnemonics.some(m => upper.includes(m))) {
          categorized[category].push(curve);
          found = true;
          break;
        }
      }

      if (!found) categorized.General.push(curve);
    });

    // Remove empty categories
    return Object.fromEntries(Object.entries(categorized).filter(([_, list]) => list.length > 0));
  }, [curves]);

  const plotData = useMemo(() => {
    if (!data || !data.depth) return [];

    const groupKeys = Object.keys(groups);
    const traces = [];

    const colors = [
      '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b',
      '#10b981', '#ef4444', '#6366f1', '#14b8a6',
      '#7c3aed', '#db2777', '#ea580c', '#059669'
    ];

    groupKeys.forEach((groupName, trackIndex) => {
      const xAxis = trackIndex === 0 ? 'x' : `x${trackIndex + 1}`;

      groups[groupName].forEach((curveName, curveIndex) => {
        traces.push({
          x: data[curveName] || [],
          y: data.depth || [],
          type: 'scatter',
          mode: 'lines',
          name: curveName,
          xaxis: xAxis,
          yaxis: 'y',
          line: {
            color: colors[(trackIndex * 3 + curveIndex) % colors.length],
            width: 1.5,
          },
          hovertemplate:
            `<b>${curveName}</b><br>` +
            'Depth: %{y:.2f} ft<br>' +
            'Value: %{x:.2f}<br>' +
            '<extra></extra>',
        });
      });
    });

    // Add gas show markers on the Gas track if it exists
    if (fluidIndicators && fluidIndicators.hasGasData && fluidIndicators.gasShows) {
      let gasTrackIndex = Object.keys(groups).indexOf('Gas');
      if (gasTrackIndex === -1) gasTrackIndex = Object.keys(groups).indexOf('General');
      if (gasTrackIndex === -1) gasTrackIndex = Object.keys(groups).length - 1;

      const xAxis = gasTrackIndex === 0 ? 'x' : `x${gasTrackIndex + 1}`;

      const gasShowDepths = fluidIndicators.gasShows.map(show => show.depth);
      const gasShowValues = fluidIndicators.gasShows.map(show => show.totalGas);

      traces.push({
        x: gasShowValues,
        y: gasShowDepths,
        xaxis: xAxis,
        yaxis: 'y',
        type: 'scatter',
        mode: 'markers',
        name: '⚡ Gas Shows',
        marker: {
          color: fluidIndicators.gasShows.map(show =>
            show.severity === 'high' ? '#dc2626' :
              show.severity === 'medium' ? '#f59e0b' : '#fbbf24'
          ),
          size: 10,
          symbol: 'star',
          line: { color: 'white', width: 1 }
        },
        hovertemplate: '<b>⚡ Gas Show</b><br>Depth: %{y:.2f} ft<br>Total Gas: %{x:.2f}<extra></extra>',
      });
    }

    return traces;
  }, [data, groups, fluidIndicators]);

  const layout = useMemo(() => {
    const groupKeys = Object.keys(groups);
    const numTracks = groupKeys.length;

    const baseLayout = {
      title: {
        text: 'Well Log Multitrack Analysis',
        font: { size: 22, color: '#1e293b', family: 'Inter, sans-serif', weight: '800' },
        pad: { b: 20 },
        y: 0.98
      },
      showlegend: true,
      legend: {
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        bordercolor: '#e2e8f0',
        borderwidth: 1,
        font: { size: 10, color: '#475569' },
        orientation: 'v',
        x: 1.02,
        y: 1,
        yanchor: 'top'
      },
      yaxis: {
        title: 'Depth (ft)',
        autorange: 'reversed',
        gridcolor: '#f1f5f9',
        zeroline: false,
        tickfont: { size: 11, color: '#64748b' },
        side: 'left',
        showline: true,
        linecolor: '#cbd5e1'
      },
      hovermode: 'closest',
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      margin: { l: 70, r: 120, t: 100, b: 60 },
      autosize: true,
      shapes: [],
      annotations: [],
    };

    // Calculate domain for each track
    groupKeys.forEach((groupName, i) => {
      const margin = 0.04;
      const width = (1 - (numTracks - 1) * margin) / numTracks;
      const start = i * (width + margin);
      const end = start + width;

      const axisName = i === 0 ? 'xaxis' : `xaxis${i + 1}`;

      baseLayout[axisName] = {
        title: {
          text: groupName,
          font: { size: 12, weight: 'bold', color: '#334155' }
        },
        domain: [start, end],
        gridcolor: '#f1f5f9',
        zeroline: false,
        tickfont: { size: 10, color: '#94a3b8' },
        showline: true,
        linecolor: '#cbd5e1',
        mirror: true
      };

      // Set logarithmic scale for resistivity
      if (groupName === 'Resistivity') {
        baseLayout[axisName].type = 'log';
        baseLayout[axisName].dtick = 1;
      }
    });

    // Add zone backgrounds
    if (zones && zones.length > 1) {
      zones.forEach((zone, index) => {
        let fillcolor = index % 2 === 0 ? 'rgba(241, 245, 249, 0.5)' : 'rgba(226, 232, 240, 0.3)';

        baseLayout.shapes.push({
          type: 'rect', xref: 'paper', yref: 'y',
          x0: 0, x1: 1,
          y0: zone.depthRange.start, y1: zone.depthRange.end,
          fillcolor: fillcolor, line: { width: 0 }, layer: 'below'
        });
      });
    }

    return baseLayout;
  }, [groups, zones, fluidIndicators]);

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };

  if (!data || !data.depth || data.depth.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center py-20">
        <div className="max-w-xs mx-auto">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No Data Visualized</h3>
          <p className="text-sm text-slate-500 mt-2">
            Configure your curve selection and depth range above to generate the log tracks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 tracking-tight">Well Log Visualization</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
              {Object.keys(groups).length} Active Tracks • {curves.length} Total Curves
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {Object.keys(groups).map((g, i) => (
            <span key={g} className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase">
              T{i + 1}: {g}
            </span>
          ))}
        </div>
      </div>

      <div className="p-6">
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '800px' }}
          useResizeHandler={true}
        />

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard label="Measurements" value={data.depth.length.toLocaleString()} unit="pts" />
          <StatCard label="Depth Range" value={`${Math.min(...data.depth).toFixed(0)}-${Math.max(...data.depth).toFixed(0)}`} unit="ft" />
          <StatCard label="Data Density" value={(data.depth.length * curves.length).toLocaleString()} unit="points" />
          <StatCard label="Active Curves" value={curves.length} unit="mnemonic" />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit }) => (
  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-black text-slate-800">{value}</span>
      <span className="text-[10px] font-bold text-slate-500 uppercase">{unit}</span>
    </div>
  </div>
);

export default WellChart;