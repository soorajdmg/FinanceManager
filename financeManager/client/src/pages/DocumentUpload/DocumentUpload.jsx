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
import StatementProcessor from '../../statementProcessor';
import './DocumentUpload.css';

const DocumentUpload = () => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [showProcessor, setShowProcessor] = useState(false);
    const fileInputRef = useRef(null);

    // Updated to focus on PDF files for bank statements
    const acceptedTypes = [
        'application/pdf'
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const validateFile = (file) => {
        if (!acceptedTypes.includes(file.type)) {
            return 'Please upload a PDF file containing your bank statement';
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
        
        // Hide processor if no files left
        if (uploadedFiles.length === 1) {
            setShowProcessor(false);
        }
    };

    const handleSubmit = async () => {
        if (uploadedFiles.length === 0) {
            setUploadError('Please upload at least one PDF bank statement file');
            return;
        }

        setIsUploading(true);
        setUploadError('');

        try {
            // Simulate upload validation process
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Update file statuses to completed
            setUploadedFiles(prev =>
                prev.map(file => ({ ...file, status: 'completed' }))
            );

            // Show the processor component
            setShowProcessor(true);

            console.log('Files ready for processing:', uploadedFiles);

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

    // If processor is shown, render it instead of upload interface
    if (showProcessor) {
        return (
            <div className="upload-container">
                <div className="upload-padding">
                    <div className="upload-max-width">
                        {/* Header */}
                        <div className="upload-header">
                            <div className="header-content">
                                <h1 className="upload-title">Processing Bank Statement</h1>
                                <p className="upload-subtitle">
                                    Your PDF is being processed and converted to CSV format
                                </p>
                                <button 
                                    onClick={() => {
                                        setShowProcessor(false);
                                        setUploadedFiles([]);
                                    }}
                                    style={{
                                        marginTop: '10px',
                                        padding: '8px 16px',
                                        backgroundColor: '#f5f5f5',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ← Back to Upload
                                </button>
                            </div>
                        </div>

                        {/* CSV Processor Component */}
                        <StatementProcessor uploadedFiles={uploadedFiles} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-container">
            <div className="upload-padding">
                <div className="upload-max-width">
                    {/* Header */}
                    <div className="upload-header">
                        <div className="header-content">
                            <h1 className="upload-title">Upload Bank Statement</h1>
                            <p className="upload-subtitle">
                                Upload your PDF bank statement files to convert them to CSV format automatically
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
                                accept=".pdf"
                                onChange={handleFileInputChange}
                                className="file-input"
                            />

                            <div className="dropzone-content">
                                <div className="upload-icon-container">
                                    <Upload className="upload-icon" />
                                </div>

                                <h3 className="dropzone-title">
                                    {isDragOver ? 'Drop PDF files here' : 'Drop & Browse your PDF bank statements here'}
                                </h3>
                                <div className="supported-formats">
                                    <p className="formats-text">Supported format:</p>
                                    <div className="format-tags">
                                        <span className="format-tag">PDF</span>
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
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Process PDF to CSV
                                    </>
                                )}
                            </button>

                            {uploadedFiles.length > 0 && !isUploading && (
                                <p className="submit-help">
                                    Ready to process {uploadedFiles.length} PDF file{uploadedFiles.length > 1 ? 's' : ''}
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
                                    <h4>Secure Processing</h4>
                                    <p>Your financial data is processed securely and never stored permanently</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <Download className="icon" />
                                </div>
                                <div className="info-content">
                                    <h4>PDF to CSV Conversion</h4>
                                    <p>Automatically extract transaction data from PDF statements into CSV format</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <CheckCircle className="icon" />
                                </div>
                                <div className="info-content">
                                    <h4>Instant Download</h4>
                                    <p>Get your processed CSV file downloaded automatically after conversion</p>
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