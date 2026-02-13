import React from 'react';
import { Check } from 'lucide-react';

const CurveSelector = ({ curves, selectedCurves, onCurveToggle }) => {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Select Curves</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {curves.map((curve) => {
          const isSelected = selectedCurves.includes(curve.mnemonic);
          
          return (
            <button
              key={curve.mnemonic}
              onClick={() => onCurveToggle(curve.mnemonic)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {curve.mnemonic}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {curve.unit || 'N/A'}
                  </p>
                  {curve.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {curve.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary-600 flex-shrink-0 ml-2" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedCurves.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Selected: {selectedCurves.length} curve{selectedCurves.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default CurveSelector;