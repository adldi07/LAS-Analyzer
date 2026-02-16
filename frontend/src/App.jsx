// src/App.jsx
import React, { useState, useRef } from 'react';
import { ChevronDown, BarChart2, Sparkles, ChevronUp } from 'lucide-react';
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
  const chartRef = useRef(null);
  const aiRef = useRef(null);

  const handleCurveToggle = (curveMnemonic) => {
    setSelectedCurves(
      selectedCurves.includes(curveMnemonic)
        ? selectedCurves.filter((c) => c !== curveMnemonic)
        : [...selectedCurves, curveMnemonic]
    );
  };

  const handleSelectAll = () => {
    setSelectedCurves(curves.map(c => c.mnemonic));
  };

  const handleClearAll = () => {
    setSelectedCurves([]);
  };

  const handleInterpretationToggle = () => {
    const newState = !showInterpretation;
    setShowInterpretation(newState);

    if (newState) {
      // Small delay to allow React to render the component before scrolling
      setTimeout(() => {
        aiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
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
        // Signal that visualization is below by scrolling after a short delay
        setTimeout(() => {
          chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
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
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {/* Curve Selection */}
              <div className="md:col-span-2">
                <CurveSelector
                  curves={curves}
                  selectedCurves={selectedCurves}
                  onCurveToggle={handleCurveToggle}
                  onSelectAll={handleSelectAll}
                  onClearAll={handleClearAll}
                />
              </div>

              {/* Depth Range */}
              <div className="h-full">
                <DepthRangeSelector
                  minDepth={wellData?.start_depth}
                  maxDepth={wellData?.stop_depth}
                  currentRange={depthRange}
                  onRangeChange={setDepthRange}
                />
              </div>
            </div>

            {/* Visualize Button - Modern Action Area */}
            <div className="flex flex-col items-center pt-4">
              <button
                onClick={handleVisualize}
                disabled={selectedCurves.length === 0}
                className="group relative px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-3">
                  {measurementData ? (
                    <>
                      Update Visualization
                      <ChevronDown className="w-5 h-5 animate-bounce" />
                    </>
                  ) : (
                    <>
                      Visualize Selected Data
                      <BarChart2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {selectedCurves.length} curves • {depthRange.stop - depthRange.start} ft interval
              </p>
            </div>

            {/* Chart Section */}
            {measurementData && (
              <div ref={chartRef} className="pt-8 scroll-mt-6">
                <WellChart
                  data={measurementData}
                  curves={selectedCurves}
                  depthRange={depthRange}
                  zones={interpretationResults?.zones}
                  fluidIndicators={interpretationResults?.fluidIndicators}
                />

                {/* AI Interpretation Button */}
                <div className="flex justify-center mt-12 mb-8">
                  <button
                    onClick={handleInterpretationToggle}
                    className="group relative px-10 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:shadow-purple-200/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      {showInterpretation ? (
                        <>
                          Hide AI Insights
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Run AI Interpretation
                          <Sparkles className="w-4 h-4 animate-pulse text-purple-200" />
                        </>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>
                </div>

                {/* AI Interpretation Panel */}
                {showInterpretation && (
                  <div ref={aiRef} className="scroll-mt-8">
                    <AIInterpretation
                      wellId={wellId}
                      curves={selectedCurves}
                      depthRange={depthRange}
                      data={measurementData}
                      onInterpretationComplete={setInterpretationResults}
                    />
                  </div>
                )}
              </div>
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