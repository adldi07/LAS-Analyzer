import React, { useState, useEffect } from 'react';

const DepthRangeSelector = ({ 
  minDepth, 
  maxDepth, 
  currentRange, 
  onRangeChange 
}) => {
  const [startDepth, setStartDepth] = useState(currentRange?.start || minDepth);
  const [stopDepth, setStopDepth] = useState(currentRange?.stop || maxDepth);

  useEffect(() => {
    if (currentRange) {
      setStartDepth(currentRange.start);
      setStopDepth(currentRange.stop);
    }
  }, [currentRange]);

  const handleApply = () => {
    if (startDepth >= stopDepth) {
      alert('Start depth must be less than stop depth');
      return;
    }
    onRangeChange({ start: startDepth, stop: stopDepth });
  };

  const handleReset = () => {
    setStartDepth(minDepth);
    setStopDepth(maxDepth);
    onRangeChange({ start: minDepth, stop: maxDepth });
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Depth Range</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Depth
          </label>
          <input
            type="number"
            value={startDepth}
            onChange={(e) => setStartDepth(parseFloat(e.target.value))}
            min={minDepth}
            max={maxDepth}
            step="any"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stop Depth
          </label>
          <input
            type="number"
            value={stopDepth}
            onChange={(e) => setStopDepth(parseFloat(e.target.value))}
            min={minDepth}
            max={maxDepth}
            step="any"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <p>Available range: {minDepth} - {maxDepth} ft</p>
          <p>Selected range: {stopDepth - startDepth} ft</p>
        </div>

        <div className="flex space-x-2">
          <button onClick={handleApply} className="btn-primary flex-1">
            Apply Range
          </button>
          <button onClick={handleReset} className="btn-secondary">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepthRangeSelector;