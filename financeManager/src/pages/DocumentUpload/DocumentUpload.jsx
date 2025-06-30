import React, { useState, useRef } from 'react';
import {
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    X,
    Download,
    Eye,
    Loader2
} from 'lucide-react';
import './DocumentUpload.css';

const DocumentUpload = () => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    // Accepted file types for bank statements
    const acceptedTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const validateFile = (file) => {
        if (!acceptedTypes.includes(file.type)) {
            return 'Please upload a valid file format (PDF, CSV, Excel, or TXT)';
        }
        if (file.size > maxFileSize) {
            return 'File size must be less than 10MB';
        }
        return null;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType) => {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('csv') || fileType.includes('excel') || fileType.includes('sheet')) return '📊';
        if (fileType.includes('text')) return '📝';
        return '📎';
    };

    const handleFileSelect = (files) => {
        const fileArray = Array.from(files);
        const validFiles = [];
        let hasError = false;

        fileArray.forEach((file) => {
            const error = validateFile(file);
            if (error) {
                setUploadError(error);
                hasError = true;
            } else {
                validFiles.push({
                    id: Date.now() + Math.random(),
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'ready'
                });
            }
        });

        if (!hasError) {
            setUploadError('');
            setUploadedFiles(prev => [...prev, ...validFiles]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };

    const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files) {
            handleFileSelect(files);
        }
    };

    const removeFile = (fileId) => {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
        setUploadError('');
    };

    const handleSubmit = async () => {
        if (uploadedFiles.length === 0) {
            setUploadError('Please upload at least one bank statement file');
            return;
        }

        setIsUploading(true);
        setUploadError('');

        try {
            // Simulate upload process
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Update file statuses to completed
            setUploadedFiles(prev =>
                prev.map(file => ({ ...file, status: 'completed' }))
            );

            console.log('Files uploaded successfully:', uploadedFiles);

        } catch (error) {
            setUploadError('Upload failed. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="upload-container">
            <div className="upload-padding">
                <div className="upload-max-width">
                    {/* Header */}
                    <div className="upload-header">
                        <div className="header-content">
                            <h1 className="upload-title">Upload Bank Statement</h1>
                            <p className="upload-subtitle">
                                Upload your bank statement files to analyze your transactions automatically
                            </p>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="upload-card">
                        <div
                            className={`upload-dropzone ${isDragOver ? 'drag-over' : ''} ${uploadedFiles.length > 0 ? 'has-files' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={openFileDialog}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.csv,.xlsx,.xls,.txt"
                                onChange={handleFileInputChange}
                                className="file-input"
                            />

                            <div className="dropzone-content">
                                <div className="upload-icon-container">
                                    <Upload className="upload-icon" />
                                </div>

                                <h3 className="dropzone-title">
                                    {isDragOver ? 'Drop files here' : 'Drop & Browse your files here'}
                                </h3>
                                <div className="supported-formats">
                                    <p className="formats-text">Supported formats:</p>
                                    <div className="format-tags">
                                        <span className="format-tag">PDF</span>
                                        <span className="format-tag">CSV</span>
                                        <span className="format-tag">Excel</span>
                                        <span className="format-tag">TXT</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {uploadError && (
                            <div className="error-message">
                                <AlertCircle className="error-icon" />
                                <span>{uploadError}</span>
                            </div>
                        )}

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                            <div className="files-section">
                                <h4 className="files-title">Uploaded Files ({uploadedFiles.length})</h4>

                                <div className="files-list">
                                    {uploadedFiles.map((fileData, index) => (
                                        <div
                                            key={fileData.id}
                                            className="file-item"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="file-info">
                                                <div className="file-icon">
                                                    {getFileIcon(fileData.type)}
                                                </div>

                                                <div className="file-details">
                                                    <p className="file-name">{fileData.name}</p>
                                                    <p className="file-size">{formatFileSize(fileData.size)}</p>
                                                </div>
                                            </div>

                                            <div className="file-actions">
                                                {fileData.status === 'completed' && (
                                                    <CheckCircle className="status-icon success" />
                                                )}

                                                <button
                                                    className="remove-file-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(fileData.id);
                                                    }}
                                                    disabled={isUploading}
                                                >
                                                    <X className="remove-icon" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="submit-section">
                            <button
                                className={`submit-btn ${isUploading ? 'loading' : ''}`}
                                onClick={handleSubmit}
                                disabled={isUploading || uploadedFiles.length === 0}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="submit-icon spinning" />
                                    </>
                                ) : (
                                    <>
                                        Analyze
                                    </>
                                )}
                            </button>

                            {uploadedFiles.length > 0 && !isUploading && (
                                <p className="submit-help">
                                    Ready to analyze {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="info-section">
                        <div className="info-grid">
                            <div className="info-item">
                                <div className="info-icon">
                                    <Eye className="icon" />
                                </div>
                                <div className="info-content">
                                    <h4>Secure Analysis</h4>
                                    <p>Your financial data is processed securely and never stored permanently</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <Download className="icon" />
                                </div>
                                <div className="info-content">
                                    <h4>Multiple Formats</h4>
                                    <p>Support for PDF, CSV, Excel, and text file formats from all major banks</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <CheckCircle className="icon" />
                                </div>
                                <div className="info-content">
                                    <h4>Instant Processing</h4>
                                    <p>Get detailed transaction analysis and insights within seconds</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentUpload;