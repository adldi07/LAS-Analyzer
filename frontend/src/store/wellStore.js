import { create } from 'zustand';

const useWellStore = create((set) => ({
  // Current well data
  wellId: null,
  wellData: null,
  curves: [],
  
  // Selected state
  selectedCurves: [],
  depthRange: { start: null, stop: null },
  
  // Measurement data
  measurementData: null,
  
  // AI interpretation
  interpretation: null,
  
  // Loading states
  isLoading: false,
  isLoadingData: false,
  isLoadingInterpretation: false,
  
  // Actions
  setWellData: (wellId, wellData) => set({ 
    wellId, 
    wellData,
    curves: wellData.curves || [],
    depthRange: {
      start: wellData.start_depth,
      stop: wellData.stop_depth,
    },
  }),
  
  setSelectedCurves: (curves) => set({ selectedCurves: curves }),
  
  setDepthRange: (range) => set({ depthRange: range }),
  
  setMeasurementData: (data) => set({ measurementData: data }),
  
  setInterpretation: (interpretation) => set({ interpretation }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setLoadingData: (isLoadingData) => set({ isLoadingData }),
  
  setLoadingInterpretation: (isLoadingInterpretation) => 
    set({ isLoadingInterpretation }),
  
  reset: () => set({
    wellId: null,
    wellData: null,
    curves: [],
    selectedCurves: [],
    depthRange: { start: null, stop: null },
    measurementData: null,
    interpretation: null,
    isLoading: false,
    isLoadingData: false,
    isLoadingInterpretation: false,
  }),
}));

export default useWellStore;