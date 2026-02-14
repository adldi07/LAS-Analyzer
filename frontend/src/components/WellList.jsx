import React, { useEffect, useState } from 'react';
import { wellApi } from '../services/api';
import { FileText, Database, Calendar } from 'lucide-react';
import useWellStore from '../store/wellStore';

const WellList = ({ onSelect }) => {
    const [wells, setWells] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use store to set well when selected
    const setWellData = useWellStore(state => state.setWellData);
    const selectedWellId = useWellStore(state => state.wellId);

    useEffect(() => {
        fetchWells();
    }, []);

    const fetchWells = async () => {
        try {
            setIsLoading(true);
            const response = await wellApi.getWells();
            if (response.success) {
                setWells(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch wells:', err);
            setError('Could not load well history');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectWell = async (well) => {
        if (onSelect) {
            onSelect(well);
        } else {
            // If no onSelect prop provided, load the well directly
            // This logic duplicates what likely happens in App.jsx or similar
            try {
                // Fetch full well details including curves
                const wellDetails = await wellApi.getWell(well.id);

                if (wellDetails.success) {
                    // Update store
                    setWellData(
                        well.id,
                        wellDetails.data,
                        wellDetails.data.curves
                    );
                }
            } catch (err) {
                console.error("Error loading well:", err);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-gray-100 rounded"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card border-red-100 bg-red-50 text-red-600">
                <p>{error}</p>
                <button onClick={fetchWells} className="text-sm font-semibold underline mt-2">Try Again</button>
            </div>
        );
    }

    if (wells.length === 0) {
        return null; // Don't show anything if no history
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                    <Database className="w-5 h-5 mr-2 text-primary-600" />
                    Recent Wells
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {wells.length} files
                </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {wells.map((well) => (
                    <button
                        key={well.id}
                        onClick={() => handleSelectWell(well)}
                        className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm group
              ${selectedWellId === well.id
                                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${selectedWellId === well.id ? 'text-primary-700' : 'text-gray-900'}`}>
                                    {well.well_name || well.filename}
                                </p>
                                {well.field_name && (
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                        Field: {well.field_name}
                                    </p>
                                )}
                            </div>
                            <FileText className={`w-4 h-4 flex-shrink-0 mt-1 ${selectedWellId === well.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-primary-400'}`} />
                        </div>

                        <div className="flex items-center mt-2 text-xs text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(well.uploaded_at).toLocaleDateString()}
                            <span className="mx-2">•</span>
                            <span>{Math.round(well.stop_depth - well.start_depth)} {well.depth_unit || 'm'}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WellList;
