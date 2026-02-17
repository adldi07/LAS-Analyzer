import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, TrendingUp, AlertTriangle, Link2, Loader2, Download } from 'lucide-react';
import { wellApi } from '../services/api';
import FluidIndicatorsCard from './FluidIndicatorsCard';
import QualityWarnings from './QualityWarnings';
import ZoneSummary from './ZoneSummary';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AIInterpretation = ({ wellId, curves, depthRange, data, onInterpretationComplete }) => {
  const [interpretation, setInterpretation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInterpretation();
  }, [wellId, curves, depthRange]);

  const loadInterpretation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await wellApi.interpretWell(
        wellId,
        curves,
        depthRange.start,
        depthRange.stop
      );

      if (response.success) {
        setInterpretation(response.data);
        if (onInterpretationComplete) {
          onInterpretationComplete(response.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to generate interpretation');
      console.error('Interpretation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!interpretation) {
      console.error('No interpretation data available for download');
      return;
    }

    setIsDownloading(true);
    console.log('🚀 Starting PDF generation process...');

    try {
      // 1. Initialize Document
      // Note: Testing both named and default imports for maximum compatibility with jspdf 4.x
      let doc;
      try {
        doc = new jsPDF();
      } catch (e) {
        console.warn('Named import failed, trying default import or window global...');
        const jsPDFRef = typeof jsPDF === 'function' ? jsPDF : (window.jsPDF || null);
        if (!jsPDFRef) throw new Error('jsPDF library not found. Please ensure it is installed.');
        doc = new jsPDFRef();
      }

      console.log('✅ jsPDF instance created successfully');

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = 20;

      // --- 1. HEADER & METADATA ---
      doc.setFillColor(37, 99, 235); // Primary 600
      doc.rect(0, 0, pageWidth, 45, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('WELL ANALYSIS REPORT', margin, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 30);
      doc.text(`Powered by LAS Analyzer AI`, margin, 35);

      currentY = 60;
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Well Information', margin, currentY);
      currentY += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const wellInfo = [
        ['Well Name:', interpretation.metadata?.wellName || 'Unknown'],
        ['Depth Interval:', `${depthRange.start || 'N/A'} - ${depthRange.stop || 'N/A'} ft`],
        ['Curves Analyzed:', (curves || []).join(', ')],
        ['AI Model:', interpretation.metadata?.model || 'Claude AI']
      ];

      wellInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, currentY);
        doc.setFont('helvetica', 'normal');

        let displayValue = String(value);

        // Truncate Curves Analyzed if it's too long for one line
        if (label === 'Curves Analyzed:') {
          const availableWidth = contentWidth - 45;
          if (doc.getTextWidth(displayValue) > availableWidth) {
            let truncated = displayValue;
            // Shorten until it fits with the suffix
            while (doc.getTextWidth(truncated + '....') > availableWidth && truncated.length > 0) {
              truncated = truncated.slice(0, -1);
            }
            displayValue = truncated + '....';
          }
        }

        doc.text(displayValue, margin + 45, currentY);
        currentY += 7;
      });

      console.log('✅ Header and Well Information added');

      // --- 2. STATISTICS TABLE ---
      if (interpretation.statistics) {
        currentY += 10;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistical Summary', margin, currentY);
        currentY += 5;

        // Add filter to handle cases where stats for a curve might be null
        const statsData = Object.entries(interpretation.statistics)
          .filter(([_, stats]) => stats !== null && typeof stats === 'object')
          .map(([curve, stats]) => [
            curve,
            (typeof stats.min === 'number' ? stats.min : 0).toFixed(2),
            (typeof stats.max === 'number' ? stats.max : 0).toFixed(2),
            (typeof stats.mean === 'number' ? stats.mean : 0).toFixed(2),
            (typeof stats.stdDev === 'number' ? stats.stdDev : 0).toFixed(2)
          ]);

        if (statsData.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['Curve', 'Min', 'Max', 'Mean', 'Std Dev']],
            body: statsData,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], halign: 'center' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
              0: { fontStyle: 'bold' },
              1: { halign: 'right' },
              2: { halign: 'right' },
              3: { halign: 'right' },
              4: { halign: 'right' }
            },
            margin: { left: margin, right: margin }
          });
          currentY = doc.lastAutoTable.finalY + 20;
        } else {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text('No statistical data available for selected curves.', margin, currentY + 5);
          currentY += 15;
        }
        console.log('✅ Statistics table handled');
      }

      // --- 3. INSIGHTS ---
      if (interpretation.fluidIndicators || interpretation.qualityIssues) {
        if (currentY > 230) { doc.addPage(); currentY = 25; }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Exploration Insights', margin, currentY);
        currentY += 10;

        if (interpretation.fluidIndicators) {
          doc.setFontSize(12);
          doc.setTextColor(5, 150, 105);
          doc.text('Fluid Indicators:', margin, currentY);
          currentY += 7;
          doc.setFontSize(10);
          doc.setTextColor(75, 85, 99);
          const feedback = interpretation.fluidIndicators.summary?.hasHydrocarbons
            ? 'Positive hydrocarbon indicators detected in the analyzed interval.'
            : 'No major fluid anomalies detected.';
          const splitFeedback = doc.splitTextToSize(feedback, contentWidth);
          doc.text(splitFeedback, margin, currentY);
          currentY += (splitFeedback.length * 5) + 5;
        }

        if (interpretation.qualityIssues) {
          if (currentY > 260) { doc.addPage(); currentY = 25; }
          doc.setFontSize(12);
          doc.setTextColor(220, 38, 38);
          doc.text('Data Quality Warnings:', margin, currentY);
          currentY += 7;
          doc.setFontSize(10);
          doc.setTextColor(75, 85, 99);
          const qualityText = interpretation.qualityIssues.length > 0
            ? `Identified ${interpretation.qualityIssues.length} measurement anomalies.`
            : 'Data quality checks passed.';
          const splitQuality = doc.splitTextToSize(qualityText, contentWidth);
          doc.text(splitQuality, margin, currentY);
          currentY += (splitQuality.length * 5) + 10;
        }
        console.log('✅ Insights added');
      }

      // --- 4. AI INTERPRETATION (Final Section) ---
      doc.addPage();
      currentY = 25;

      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Geologic Interpretation', margin, currentY);

      // Sub-underline for title
      doc.setDrawColor(219, 234, 254); // Blue 100
      doc.setLineWidth(0.5);
      doc.line(margin, currentY + 4, margin + 80, currentY + 4);

      currentY += 18;

      const sections = interpretation.interpretation.split('\n');
      doc.setTextColor(31, 41, 55);

      sections.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          currentY += 4;
          return;
        }

        // Handle page overflow
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }

        // 1. Handle Headers (e.g., # Header, ## Header)
        if (trimmedLine.match(/^#+\s+/)) {
          const headerLevel = trimmedLine.match(/^#+/)[0].length;
          const text = trimmedLine.replace(/^#+\s+/, '').replace(/[^\x00-\x7F]/g, '');

          currentY += 6;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(headerLevel === 1 ? 16 : 13);
          doc.setTextColor(37, 99, 235);

          const splitHeader = doc.splitTextToSize(text, contentWidth);
          doc.text(splitHeader, margin, currentY);
          currentY += (splitHeader.length * 7) + 2;

          // Underline for Level 1 headers
          if (headerLevel === 1) {
            doc.setDrawColor(229, 231, 235);
            doc.line(margin, currentY, margin + contentWidth, currentY);
            currentY += 4;
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10.5);
          doc.setTextColor(31, 41, 55);
          return;
        }

        // 2. Handle List Items
        if (trimmedLine.match(/^[\-\*\•]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
          // Remove the markdown marker (e.g., "- " or "1. ")
          let cleanText = trimmedLine.replace(/^([\-\*\•]\s+|\d+\.\s+)/, '').replace(/[^\x00-\x7F]/g, '');

          // Check for lead bold: **Text**
          const boldMatch = cleanText.match(/^\*\*(.*?)\*\*(.*)/);

          doc.setFontSize(10.5);
          doc.setTextColor(75, 85, 99);
          doc.text('•', margin + 2, currentY);

          if (boldMatch) {
            const boldPart = boldMatch[1];
            const normalPart = boldMatch[2];

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(31, 41, 55);
            doc.text(boldPart, margin + 7, currentY);

            const boldWidth = doc.getTextWidth(boldPart);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(55, 65, 81);

            const splitRemaining = doc.splitTextToSize(normalPart, contentWidth - 10 - boldWidth);
            doc.text(splitRemaining, margin + 7 + boldWidth, currentY);
            currentY += (splitRemaining.length * 6) + 2;
          } else {
            doc.setFont('helvetica', 'normal');
            const splitList = doc.splitTextToSize(cleanText, contentWidth - 8);
            doc.text(splitList, margin + 7, currentY);
            currentY += (splitList.length * 6) + 2;
          }
          return;
        }

        // 3. Handle Normal Paragraphs
        if (trimmedLine.length > 0) {
          // Detect full-line bold or italic
          let style = 'normal';
          let text = trimmedLine.replace(/[^\x00-\x7F]/g, '');

          if (text.startsWith('**') && text.endsWith('**')) {
            style = 'bold';
            text = text.slice(2, -2);
          } else if (text.startsWith('*') && text.endsWith('*')) {
            style = 'italic';
            text = text.slice(1, -1);
          }

          // Clean up internal bold tags if we are just stripping them for simplicity
          text = text.replace(/\*\*/g, '').replace(/`/g, "'");

          doc.setFont('helvetica', style);
          doc.setFontSize(10.5);
          doc.setTextColor(55, 65, 81);

          const splitText = doc.splitTextToSize(text, contentWidth);
          doc.text(splitText, margin, currentY);
          currentY += (splitText.length * 6) + 3;
        }
      });

      console.log('✅ AI Interpretation rendered with professional formatting');

      // Footer on all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 285, { align: 'center' });
        doc.text('Confidential - LAS Analyzer AI Report', margin, 285);
      }

      const filename = `Well_Analysis_${interpretation.metadata?.wellName || 'Report'}_${new Date().getTime()}.pdf`;
      doc.save(filename);
      console.log(`🎉 PDF saved successfully: ${filename}`);

    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      alert('Could not generate PDF: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-lg">Analyzing well data with AI...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">{error}</p>
        <button onClick={loadInterpretation} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  if (!interpretation) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* NEW: Fluid Indicators - Show first for maximum impact! */}
      {interpretation.fluidIndicators && (
        <FluidIndicatorsCard fluidIndicators={interpretation.fluidIndicators} />
      )}

      {/* NEW: Quality Warnings */}
      {interpretation.qualityIssues && (
        <QualityWarnings qualityIssues={interpretation.qualityIssues} />
      )}

      {/* NEW: Zone Segmentation */}
      {interpretation.zones && (
        <ZoneSummary zones={interpretation.zones} />
      )}

      {/* Main Interpretation */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Brain className="w-6 h-6 text-primary-600 mr-2" />
          <h3 className="text-xl font-semibold">AI Interpretation</h3>
        </div>

        <div className="prose max-w-none text-gray-700 leading-relaxed">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-primary-800 mt-6 mb-3 flex items-center" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2" {...props} />,
              p: ({ node, ...props }) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
              li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary-200 pl-4 italic text-gray-600 my-4" {...props} />,
            }}
          >
            {interpretation.interpretation}
          </ReactMarkdown>
        </div>

        <div className="mt-4 pt-4 border-t text-sm text-gray-500">
          Generated by {interpretation.metadata?.model || 'Claude AI'} on{' '}
          {new Date(interpretation.metadata?.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Statistics */}
      <div className="card">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-6 h-6 text-primary-600 mr-2" />
          <h3 className="text-xl font-semibold">Statistical Summary</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(interpretation.statistics || {}).map(([curve, stats]) => {
            if (!stats) return null;

            return (
              <div key={curve} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-primary-700 mb-2">{curve}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min:</span>
                    <span className="font-medium">{stats.min.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max:</span>
                    <span className="font-medium">{stats.max.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mean:</span>
                    <span className="font-medium">{stats.mean.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Std Dev:</span>
                    <span className="font-medium">{stats.stdDev.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomalies */}
      {interpretation.anomalies && interpretation.anomalies.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
            <h3 className="text-xl font-semibold">Detected Anomalies</h3>
          </div>

          <div className="space-y-2">
            {interpretation.anomalies.slice(0, 10).map((anomaly, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div>
                  <span className="font-medium">{anomaly.curve}</span>
                  <span className="text-gray-600 mx-2">at</span>
                  <span className="font-medium">{anomaly.depth.toFixed(1)} ft</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Value: {anomaly.value.toFixed(2)}</div>
                  <div className="text-xs text-yellow-700">
                    {anomaly.deviation.toFixed(1)}σ deviation
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlations */}
      {interpretation.correlations && interpretation.correlations.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-4">
            <Link2 className="w-6 h-6 text-primary-600 mr-2" />
            <h3 className="text-xl font-semibold">Curve Correlations</h3>
          </div>

          <div className="space-y-2">
            {interpretation.correlations.slice(0, 10).map((corr, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium">{corr.curve1}</span>
                  <span className="text-gray-600 mx-2">↔</span>
                  <span className="font-medium">{corr.curve2}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className={`h-2 rounded-full ${corr.correlation > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium w-16 text-right">
                    {corr.correlation.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Action */}
      <div className="flex justify-center pt-8 border-t border-gray-100 mt-6">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className={`flex items-center gap-3 px-10 py-5 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all duration-300 overflow-hidden ${isDownloading
            ? 'bg-gray-400 cursor-wait'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200/50 hover:scale-[1.02] active:scale-95'
            }`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download Comprehensive Well Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIInterpretation;