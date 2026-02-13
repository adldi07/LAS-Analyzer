import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
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
    
    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.las')) {
      setError('Please select a .las file');
      return;
    }
    
    // Validate file size (50MB limit)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const response = await wellApi.uploadLASFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success) {
        setWellData(response.data.wellId, {
          ...response.data,
          curves: response.data.curves,
          start_depth: response.data.depthRange.start,
          stop_depth: response.data.depthRange.stop,
        });
        
        onUploadComplete?.(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    setError(null);
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Upload LAS File</h2>
      
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">
            Drag and drop your LAS file here, or
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary mt-2"
          >
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".las"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-4">
            Maximum file size: 50MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-primary-600" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {uploadProgress === 100 ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <button
                onClick={handleRemoveFile}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {uploadProgress !== 100 && (
            <button
              onClick={handleUpload}
              disabled={uploadProgress > 0}
              className="btn-primary w-full"
            >
              {uploadProgress > 0 ? 'Uploading...' : 'Upload and Process'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;