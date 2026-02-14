import React, { useState, useEffect } from 'react';
import { Ruler, RefreshCcw, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';

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

  const selectedLength = stopDepth - startDepth;
  const totalLength = maxDepth - minDepth;
  const percentage = (selectedLength / totalLength) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <Ruler className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Depth Parameters</h3>
      </div>

      <div className="space-y-8 flex-1">
        {/* Visual Slider */}
        <div className="px-2 pt-2 pb-6">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[startDepth, stopDepth]}
            min={minDepth}
            max={maxDepth}
            step={1}
            onValueChange={([start, stop]) => {
              setStartDepth(start);
              setStopDepth(stop);
            }}
          >
            <Slider.Track className="bg-slate-100 relative grow rounded-full h-1.5">
              <Slider.Range className="absolute bg-primary-500 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-white border-2 border-primary-600 shadow-md rounded-full hover:scale-110 focus:outline-none transition-transform cursor-pointer"
              aria-label="Start Depth"
            />
            <Slider.Thumb
              className="block w-5 h-5 bg-white border-2 border-primary-600 shadow-md rounded-full hover:scale-110 focus:outline-none transition-transform cursor-pointer"
              aria-label="Stop Depth"
            />
          </Slider.Root>
          <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            <span>{minDepth} ft</span>
            <span>{maxDepth} ft</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <label className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              <ArrowDownCircle className="w-3 h-3 mr-1.5 text-blue-500" />
              Start Depth
            </label>
            <div className="relative">
              <input
                type="number"
                value={startDepth}
                onChange={(e) => setStartDepth(parseFloat(e.target.value) || minDepth)}
                min={minDepth}
                max={stopDepth}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">ft</span>
            </div>
          </div>

          <div className="relative">
            <label className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              <ArrowUpCircle className="w-3 h-3 mr-1.5 text-indigo-500" />
              Stop Depth
            </label>
            <div className="relative">
              <input
                type="number"
                value={stopDepth}
                onChange={(e) => setStopDepth(parseFloat(e.target.value) || maxDepth)}
                min={startDepth}
                max={maxDepth}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">ft</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Range</span>
            <span className="text-sm font-bold text-primary-600">{selectedLength.toFixed(1)} ft</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Viewing {percentage.toFixed(1)}% of the total {totalLength.toFixed(1)} ft interval.
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={handleApply}
          className="flex-[3] py-4 bg-gradient-to-br from-primary-600 to-indigo-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-1 active:translate-y-0 transition-all border-b-4 border-indigo-800"
        >
          Apply Changes
        </button>
        <button
          onClick={handleReset}
          className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center border border-slate-200"
          title="Reset to full well range"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default DepthRangeSelector;