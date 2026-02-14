import React from 'react';
import { AlertTriangle, AlertCircle, XCircle, Info } from 'lucide-react';

const QualityWarnings = ({ qualityIssues }) => {
    if (!qualityIssues || qualityIssues.summary.totalIssues === 0) {
        return (
            <div className="card bg-green-50 border border-green-200">
                <div className="flex items-center">
                    <Info className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-green-800 font-medium">
                        ✅ No data quality issues detected
                    </p>
                </div>
            </div>
        );
    }

    const { warnings, errors, summary } = qualityIssues;

    // Determine alert variant based on severity
    const getAlertStyles = () => {
        switch (summary.severity) {
            case 'high':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-300',
                    icon: XCircle,
                    iconColor: 'text-red-600',
                    textColor: 'text-red-900',
                    title: '⚠️ Critical Data Quality Issues'
                };
            case 'medium':
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-300',
                    icon: AlertTriangle,
                    iconColor: 'text-orange-600',
                    textColor: 'text-orange-900',
                    title: '⚠️ Data Quality Warnings'
                };
            default:
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-300',
                    icon: AlertCircle,
                    iconColor: 'text-yellow-600',
                    textColor: 'text-yellow-900',
                    title: 'ℹ️ Minor Data Quality Notes'
                };
        }
    };

    const styles = getAlertStyles();
    const Icon = styles.icon;

    // Get icon for issue type
    const getIssueIcon = (type) => {
        switch (type) {
            case 'STUCK_TOOL':
                return '🔧';
            case 'OUT_OF_RANGE':
                return '📊';
            case 'MISSING_DATA':
                return '❓';
            case 'LOW_VARIANCE':
                return '📉';
            case 'NEGATIVE_VALUES':
                return '⛔';
            default:
                return '⚠️';
        }
    };

    return (
        <div className={`card ${styles.bg} border-2 ${styles.border}`}>
            {/* Header */}
            <div className="flex items-center mb-4">
                <Icon className={`w-6 h-6 ${styles.iconColor} mr-2`} />
                <h3 className={`text-xl font-semibold ${styles.textColor}`}>
                    {styles.title}
                </h3>
            </div>

            {/* Summary */}
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                        Total Issues: <span className="font-bold">{summary.totalIssues}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${summary.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : summary.severity === 'medium'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {summary.severity.toUpperCase()} SEVERITY
                    </span>
                </div>
            </div>

            {/* Errors (if any) */}
            {errors && errors.length > 0 && (
                <div className="mb-4">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                        <XCircle className="w-4 h-4 mr-2" />
                        Errors ({errors.length})
                    </h4>
                    <div className="space-y-2">
                        {errors.map((error, index) => (
                            <div
                                key={index}
                                className="bg-red-100 border border-red-300 p-3 rounded-lg"
                            >
                                <div className="flex items-start">
                                    <span className="text-lg mr-2">{getIssueIcon(error.type)}</span>
                                    <div className="flex-1">
                                        <div className="font-mono text-sm font-semibold text-red-900">
                                            {error.curve}
                                        </div>
                                        <div className="text-sm text-red-800 mt-1">
                                            {error.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
                <div>
                    <h4 className={`font-semibold mb-2 flex items-center ${styles.textColor}`}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Warnings ({warnings.length})
                    </h4>
                    <div className="space-y-2">
                        {warnings.slice(0, 5).map((warning, index) => (
                            <div
                                key={index}
                                className={`bg-white border p-3 rounded-lg ${warning.severity === 'high'
                                    ? 'border-red-300'
                                    : warning.severity === 'medium'
                                        ? 'border-orange-300'
                                        : 'border-yellow-300'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start flex-1">
                                        <span className="text-lg mr-2">{getIssueIcon(warning.type)}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-semibold text-gray-900">
                                                    {warning.curve}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${warning.severity === 'high'
                                                    ? 'bg-red-100 text-red-700'
                                                    : warning.severity === 'medium'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {warning.severity}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-700 mt-1">
                                                {warning.message}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {warnings.length > 5 && (
                            <div className="text-center p-2 text-sm font-medium text-gray-600 bg-gray-50 rounded border border-gray-200">
                                + {warnings.length - 5} more warnings
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer Note */}
            <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-700 italic">
                    💡 <strong>Note:</strong> These issues don't prevent analysis but should be reviewed carefully.
                    The AI interpretation considers these quality factors in its assessment.
                </p>
            </div>
        </div>
    );
};

export default QualityWarnings;
