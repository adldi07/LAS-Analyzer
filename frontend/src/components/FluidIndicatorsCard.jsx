import React from 'react';
import { Droplet, Flame, TrendingUp } from 'lucide-react';

const FluidIndicatorsCard = ({ fluidIndicators }) => {
    if (!fluidIndicators || !fluidIndicators.hasGasData) {
        return null;
    }

    const { summary, gasZones, gasComposition } = fluidIndicators;

    // Determine severity color
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high':
                return 'bg-red-50 border-red-300 text-red-900';
            case 'medium':
                return 'bg-orange-50 border-orange-300 text-orange-900';
            default:
                return 'bg-yellow-50 border-yellow-300 text-yellow-900';
        }
    };

    return (
        <div className="card bg-green-50 border-2 border-green-500">
            {/* Header */}
            <div className="flex items-center mb-4">
                <Flame className="w-6 h-6 text-green-700 mr-2" />
                <h3 className="text-xl font-semibold text-green-900">
                    ⚡ Hydrocarbon Indicators Detected
                </h3>
            </div>

            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Gas Shows</div>
                    <div className="text-2xl font-bold text-green-700">
                        {summary.totalGasShows}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        detected above threshold
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Peak Gas</div>
                    <div className="text-2xl font-bold text-green-700">
                        {summary.maxGasValue.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        units (maximum reading)
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Gas Zones</div>
                    <div className="text-2xl font-bold text-green-700">
                        {summary.gasZoneCount}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        continuous zones identified
                    </div>
                </div>
            </div>

            {/* Gas Zones */}
            {gasZones && gasZones.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Gas Zones Identified
                    </h4>
                    <div className="space-y-2">
                        {gasZones.map((zone, index) => (
                            <div
                                key={index}
                                className="bg-white p-3 rounded-lg border border-green-200"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-mono text-sm font-semibold text-green-800">
                                            {zone.depthRange}
                                        </span>
                                        <span className="text-xs text-gray-600 ml-2">
                                            ({zone.thickness} ft thick)
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-600">
                                            {zone.showCount} shows
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Avg Gas:</span>
                                        <span className="ml-2 font-medium text-green-700">
                                            {zone.avgGas} units
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Peak:</span>
                                        <span className="ml-2 font-medium text-green-700">
                                            {zone.peakGas} units
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Gas Composition */}
            {summary.hasCompositionData && gasComposition && gasComposition.length > 0 && (
                <div>
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                        <Droplet className="w-4 h-4 mr-2" />
                        Gas Composition Analysis
                    </h4>
                    <div className="space-y-2">
                        {gasComposition.slice(0, 5).map((comp, index) => (
                            <div
                                key={index}
                                className="bg-white p-3 rounded-lg border border-green-200 flex justify-between items-center"
                            >
                                <div>
                                    <span className="font-mono text-sm font-semibold">
                                        {comp.depth.toFixed(1)} ft
                                    </span>
                                    <span className="text-xs text-gray-600 ml-2">
                                        C1/C2 = {comp.ratio.toFixed(1)}
                                    </span>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${comp.interpretation === 'Dry gas'
                                            ? 'bg-blue-100 text-blue-800'
                                            : comp.interpretation === 'Wet gas'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}>
                                        {comp.interpretation}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* High Priority Depths */}
            {summary.depthsOfInterest && summary.depthsOfInterest.length > 0 && (
                <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="text-sm text-green-800">
                        <span className="font-semibold">High-priority depths:</span>{' '}
                        {summary.depthsOfInterest.map(d => d.toFixed(1)).join(' ft, ')} ft
                    </div>
                </div>
            )}

            {/* Call to Action */}
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-sm text-green-900 font-medium">
                    💡 <strong>Commercial Potential:</strong> Review AI interpretation below for detailed assessment of hydrocarbon potential.
                </p>
            </div>
        </div>
    );
};

export default FluidIndicatorsCard;
