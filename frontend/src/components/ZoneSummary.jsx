import React from 'react';
import { Layers, TrendingUp, BarChart3 } from 'lucide-react';

const ZoneSummary = ({ zones }) => {
    if (!zones || zones.length <= 1) {
        return null;
    }

    // Get characterization color
    const getCharacterizationColor = (characterization) => {
        if (characterization.includes('Shaly')) {
            return 'bg-gray-100 border-gray-400 text-gray-900';
        } else if (characterization.includes('Clean')) {
            return 'bg-blue-100 border-blue-400 text-blue-900';
        } else if (characterization.includes('Mixed')) {
            return 'bg-purple-100 border-purple-400 text-purple-900';
        }
        return 'bg-gray-100 border-gray-400 text-gray-900';
    };

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center mb-4">
                <Layers className="w-6 h-6 text-primary-600 mr-2" />
                <h3 className="text-xl font-semibold">Zone Segmentation</h3>
            </div>

            {/* Summary */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                    <strong>📊 {zones.length} distinct geological zones</strong> identified based on curve variations.
                    Each zone represents a potentially different lithology or depositional environment.
                </p>
            </div>

            {/* Zones */}
            <div className="space-y-4">
                {zones.map((zone) => (
                    <div
                        key={zone.id}
                        className={`border-2 rounded-lg overflow-hidden ${getCharacterizationColor(zone.characterization)}`}
                    >
                        {/* Zone Header */}
                        <div className="p-4 bg-white border-b-2">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">
                                        Zone {zone.id}
                                    </h4>
                                    <div className="text-sm text-gray-600 font-mono mt-1">
                                        {zone.depthRange.start.toFixed(1)} - {zone.depthRange.end.toFixed(1)} ft
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary-600">
                                        {zone.thickness.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-gray-600">ft thick</div>
                                </div>
                            </div>

                            {/* Characterization Badge */}
                            <div className="mt-3">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${getCharacterizationColor(zone.characterization)}`}>
                                    {zone.characterization}
                                </span>
                            </div>
                        </div>

                        {/* Zone Statistics */}
                        <div className="p-4 bg-gray-50">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Key Statistics
                            </h5>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(zone.statistics).slice(0, 6).map(([curve, stat]) => (
                                    <div key={curve} className="bg-white p-3 rounded border border-gray-200">
                                        <div className="text-xs font-semibold text-gray-600 mb-1">
                                            {curve}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-bold text-gray-900">
                                                {stat.mean.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-gray-500">avg</span>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {stat.min.toFixed(2)} - {stat.max.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Interpretation Hint */}
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-900">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    <strong>Vertical Sequence Analysis:</strong> Review the AI interpretation below for insights on what this
                    vertical sequence suggests about the depositional environment and geological history.
                </p>
            </div>
        </div>
    );
};

export default ZoneSummary;
