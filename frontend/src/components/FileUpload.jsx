import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, Cloud, FileCode, Activity } from 'lucide-react';
import { wellApi } from '../services/api';
import useWellStore from '../store/wellStore';

const FileUpload = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { setWellData, setLoading } = useWellStore();

  const handleFileSelect = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.las')) {
      setError('Invalid file format. Please upload a .las file.');
      return;
    }

    // Validate file size (50MB limit)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadProgress(1); // Start progress

    try {
      // Simulate progress for better UX
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 100);

      const response = await wellApi.uploadLASFile(file);

      clearInterval(interval);
      setUploadProgress(100);

      if (response.success) {
        setTimeout(() => {
          setWellData(response.data.wellId, {
            ...response.data,
            curves: response.data.curves,
            start_depth: response.data.depthRange.start,
            stop_depth: response.data.depthRange.stop,
          });
          onUploadComplete?.(response.data);
        }, 500); // Small delay to show completion
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
            <Activity size={150} />
          </div>
          <h2 className="text-3xl font-bold mb-2 relative z-10">Upload Well Log Data</h2>
          <p className="text-blue-100 text-lg relative z-10">
            Analyze LAS 2.0/3.0 files with advanced AI interpretation algorithms.
          </p>
        </div>

        <div className="p-8">
          {!file ? (
            <div
              className={`
                relative border-3 border-dashed rounded-xl p-12 text-center transition-all duration-300 ease-in-out cursor-pointer group
                ${isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                  : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".las"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              <div className="mb-6 relative">
                <div className={`
                    w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 transition-transform duration-300
                    ${isDragging ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}
                `}>
                  <Cloud size={40} />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Click to upload or drag and drop
              </h3>
              <p className="text-slate-500 mb-6">
                Supported format: .LAS (Log ASCII Standard)
              </p>

              {/* Feature Badges */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['GR', 'RHOB', 'NPHI', 'DT', 'RES'].map((curve) => (
                  <span key={curve} className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full border border-slate-200">
                    {curve}
                  </span>
                ))}
                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full border border-green-200">
                  + Gas Data
                </span>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex items-start justify-between mb-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <FileCode size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-lg">{file.name}</h4>
                    <p className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                {uploadProgress < 100 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
                {uploadProgress === 100 && (
                  <div className="flex items-center text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full text-sm">
                    <CheckCircle size={16} className="mr-1.5" />
                    Uploaded
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {uploadProgress > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-blue-600">{uploadProgress < 100 ? 'Analyzing file structure...' : 'Processing complete!'}</span>
                    <span className="text-slate-600">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-start gap-3">
                  <CheckCircle className="shrink-0 mt-0.5 rotate-45" size={20} />
                  <div>
                    <p className="font-medium">Upload Error</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                </div>
              )}

              {uploadProgress === 0 && (
                <div className="flex gap-4">
                  <button
                    onClick={handleRemoveFile}
                    className="flex-1 py-3 px-6 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all active:translate-y-0"
                  >
                    Analyze Data
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center mt-8 text-slate-400 text-sm">
        <p>Your data is processed securely. Maximum file size 50MB.</p>
      </div>
    </div>
  );
};

export default FileUpload;