// src/App.jsx
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import WellList from './components/WellList';
import CurveSelector from './components/CurveSelector';
import DepthRangeSelector from './components/DepthRangeSelector';
import WellChart from './components/WellChart';
import AIInterpretation from './components/AIInterpretation';
import FloatingChatbot from './components/FloatingChatbot';
import useWellStore from './store/wellStore';
import { wellApi } from './services/api';

function App() {
  const {
    wellId,
    wellData,
    curves,
    selectedCurves,
    depthRange,
    measurementData,
    setSelectedCurves,
    setDepthRange,
    setMeasurementData,
    setLoadingData,
  } = useWellStore();

  const [showInterpretation, setShowInterpretation] = useState(false);
  const [interpretationResults, setInterpretationResults] = useState(null);

  const handleCurveToggle = (curveMnemonic) => {
    setSelectedCurves(
      selectedCurves.includes(curveMnemonic)
        ? selectedCurves.filter((c) => c !== curveMnemonic)
        : [...selectedCurves, curveMnemonic]
    );
  };

  const handleVisualize = async () => {
    if (selectedCurves.length === 0) {
      alert('Please select at least one curve');
      return;
    }

    setLoadingData(true);
    setShowInterpretation(false);
    setInterpretationResults(null);
    try {
      const response = await wellApi.getMeasurements(
        wellId,
        selectedCurves,
        depthRange.start,
        depthRange.stop
      );

      if (response.success) {
        setMeasurementData(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch measurement data');
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            LAS Well Log Analyzer
          </h1>
          <p className="text-gray-600 mt-1">
            Upload, visualize, and analyze well-log data with AI
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!wellId ? (
          <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
            <div className="md:col-span-7 h-full">
              <FileUpload onUploadComplete={() => { }} />
            </div>
            <div className="md:col-span-3 h-full flex flex-col">
              <WellList />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Well Information */}
            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Well: {wellData?.well_name || 'Unknown'}
                  </h2>
                  {wellData?.field_name && (
                    <p className="text-sm text-gray-500 mt-1">
                      Field: {wellData.field_name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => useWellStore.getState().reset()}
                  className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors border border-primary-200"
                >
                  Switch Well
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t border-gray-100">
                <div>
                  <p className="text-gray-600">Field</p>
                  <p className="font-medium">{wellData?.field_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Depth Range</p>
                  <p className="font-medium">
                    {wellData?.start_depth} - {wellData?.stop_depth} ft
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Step</p>
                  <p className="font-medium">{wellData?.step} ft</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Curves</p>
                  <p className="font-medium">{curves.length}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Curve Selection */}
              <div className="md:col-span-2">
                <CurveSelector
                  curves={curves}
                  selectedCurves={selectedCurves}
                  onCurveToggle={handleCurveToggle}
                />
              </div>

              {/* Depth Range */}
              <div>
                <DepthRangeSelector
                  minDepth={wellData?.start_depth}
                  maxDepth={wellData?.stop_depth}
                  currentRange={depthRange}
                  onRangeChange={setDepthRange}
                />
              </div>
            </div>

            {/* Visualize Button */}
            <div className="flex justify-center">
              <button
                onClick={handleVisualize}
                disabled={selectedCurves.length === 0}
                className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Visualize Selected Curves
              </button>
            </div>

            {/* Chart */}
            {measurementData && (
              <>
                <WellChart
                  data={measurementData}
                  curves={selectedCurves}
                  depthRange={depthRange}
                  zones={interpretationResults?.zones}
                  fluidIndicators={interpretationResults?.fluidIndicators}
                />

                {/* AI Interpretation Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowInterpretation(!showInterpretation)}
                    className="btn-primary px-6 py-2"
                  >
                    {showInterpretation ? 'Hide' : 'Show'} AI Interpretation
                  </button>
                </div>

                {/* AI Interpretation Panel */}
                {showInterpretation && (
                  <AIInterpretation
                    wellId={wellId}
                    curves={selectedCurves}
                    depthRange={depthRange}
                    data={measurementData}
                    onInterpretationComplete={setInterpretationResults}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Chatbot - Always available when well is loaded */}
      <FloatingChatbot />
    </div>
  );
}

export default App;