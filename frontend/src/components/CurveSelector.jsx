import React from 'react';
import { Check, Layers, CheckSquare, Trash2 } from 'lucide-react';

const CurveSelector = ({ curves, selectedCurves, onCurveToggle, onSelectAll, onClearAll }) => {
  const MAX_VISIBLE_BADGES = 6;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Select Curves</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Select All
          </button>
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-2 mb-6 flex-1 max-h-[400px] custom-scrollbar">
        {curves.map((curve) => {
          const isSelected = selectedCurves.includes(curve.mnemonic);

          return (
            <button
              key={curve.mnemonic}
              onClick={() => onCurveToggle(curve.mnemonic)}
              className={`group p-4 rounded-xl border-2 text-left transition-all relative ${isSelected
                ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-50'
                : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                }`}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-1">
                  <p className={`font-mono font-black text-base lg:text-lg ${isSelected ? 'text-primary-700' : 'text-slate-800'}`}>
                    {curve.mnemonic}
                  </p>
                  {isSelected && (
                    <div className="bg-primary-500 rounded-full p-0.5 shadow-sm">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                  {curve.unit || 'UNKN'}
                </p>
                {curve.description && (
                  <p className="text-[11px] text-slate-500 mt-2 leading-tight line-clamp-2 italic opacity-80">
                    {curve.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5 overflow-hidden flex-1">
          {selectedCurves.length === 0 ? (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No curves selected</span>
          ) : (
            <>
              {selectedCurves.slice(0, MAX_VISIBLE_BADGES).map(c => (
                <span key={c} className="px-2.5 py-1 bg-primary-100 text-primary-700 text-[10px] font-black rounded-md border border-primary-200">
                  {c}
                </span>
              ))}
              {selectedCurves.length > MAX_VISIBLE_BADGES && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md border border-slate-200 animate-pulse">
                  + {selectedCurves.length - MAX_VISIBLE_BADGES} More...
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Selected</p>
          <p className="text-xl font-black text-primary-600 leading-none">{selectedCurves.length}</p>
        </div>
      </div>
    </div>
  );
};

export default CurveSelector;