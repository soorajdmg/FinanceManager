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
    const [processedData, setProcessedData] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [importingTransactions, setImportingTransactions] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const fileInputRef = useRef(null);

    // API Base URL - Safe way to access environment variables
    const API_BASE_URL = window.env?.REACT_APP_API_URL || 'http://localhost:5000/api';

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

        // Hide results if no files left
        if (uploadedFiles.length === 1) {
            setShowResults(false);
            setProcessedData(null);
        }
    };

    // Function to get authentication token (adjust based on your auth implementation)
    const getAuthToken = () => {
        // Replace this with your actual token retrieval logic
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    };

    const processFile = async (fileData, index) => {
        try {
            // Update file status to processing
            setUploadedFiles(prev =>
                prev.map(file =>
                    file.id === fileData.id
                        ? { ...file, status: 'processing' }
                        : file
                )
            );

            // Create FormData to send file to backend
            const formData = new FormData();
            formData.append('bankStatement', fileData.file);

            const token = getAuthToken();

            const response = await fetch(`${API_BASE_URL}/upload/bank-statement`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const result = await response.json();
            console.log(`Upload result for file ${index + 1}:`, result);

            if (!response.ok) {
                throw new Error(result.message || 'Upload failed');
            }

            // Update file status to completed
            setUploadedFiles(prev =>
                prev.map(file =>
                    file.id === fileData.id
                        ? { ...file, status: 'completed', processedData: result.data }
                        : file
                )
            );

            return result.data;

        } catch (error) {
            console.error(`Upload error for file ${index + 1}:`, error);

            // Update file status to error
            setUploadedFiles(prev =>
                prev.map(file =>
                    file.id === fileData.id
                        ? { ...file, status: 'error', error: error.message }
                        : file
                )
            );

            throw error;
        }
    };

    const handleSubmit = async () => {
        if (uploadedFiles.length === 0) {
            setUploadError('Please upload at least one PDF bank statement file');
            return;
        }

        setIsUploading(true);
        setUploadError('');
        setUploadProgress({ current: 0, total: uploadedFiles.length });

        const allProcessedData = [];
        let successCount = 0;
        let errorCount = 0;

        try {
            // Process files one by one
            for (let i = 0; i < uploadedFiles.length; i++) {
                const fileData = uploadedFiles[i];
                setUploadProgress({ current: i + 1, total: uploadedFiles.length });

                try {
                    const processedResult = await processFile(fileData, i);
                    allProcessedData.push(processedResult);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    // Continue processing other files even if one fails
                }
            }

            // Combine all processed data
            const combinedData = {
                transactions: [],
                transactionsFound: 0,
                accountInfo: {},
                filesProcessed: uploadedFiles.length,
                successCount,
                errorCount
            };

            allProcessedData.forEach(data => {
                if (data.transactions && Array.isArray(data.transactions)) {
                    combinedData.transactions = [...combinedData.transactions, ...data.transactions];
                }
                combinedData.transactionsFound += data.transactionsFound || 0;

                // Use account info from first successful file
                if (data.accountInfo && Object.keys(combinedData.accountInfo).length === 0) {
                    combinedData.accountInfo = data.accountInfo;
                }
            });

            // Store combined processed data
            setProcessedData(combinedData);
            setShowResults(true);

            if (errorCount > 0) {
                setUploadError(`${successCount} file(s) processed successfully, ${errorCount} file(s) failed`);
            }

            console.log('All files processed:', combinedData);

        } catch (error) {
            setUploadError('Processing failed. Please try again.');
            console.error('Processing error:', error);
        } finally {
            setIsUploading(false);
            setUploadProgress({ current: 0, total: 0 });
        }
    };

    const categorizeTransaction = (description) => {
        const desc = description.toLowerCase();

        if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wage')) {
            return 'work';
        }
        if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('utilities')) {
            return 'housing';
        }
        if (desc.includes('grocery') || desc.includes('restaurant') || desc.includes('food') || desc.includes('dining')) {
            return 'food';
        }
        if (desc.includes('uber') || desc.includes('taxi') || desc.includes('transport') || desc.includes('gas') || desc.includes('fuel')) {
            return 'transport';
        }
        if (desc.includes('amazon') || desc.includes('shopping') || desc.includes('store') || desc.includes('retail')) {
            return 'shopping';
        }
        if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('movie') || desc.includes('entertainment')) {
            return 'entertainment';
        }
        if (desc.includes('hospital') || desc.includes('doctor') || desc.includes('pharmacy') || desc.includes('medical')) {
            return 'health';
        }
        if (desc.includes('flight') || desc.includes('hotel') || desc.includes('travel') || desc.includes('vacation')) {
            return 'travel';
        }

        return 'personal';
    };

    const handleImportTransactions = async () => {
        if (!processedData || !processedData.transactions) {
            setUploadError('No transaction data available to import');
            return;
        }

        setImportingTransactions(true);
        setUploadError('');

        try {
            const token = getAuthToken();

            const response = await fetch(`${API_BASE_URL}/upload/import-transactions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transactions: processedData.transactions
                })
            });

            const result = await response.json();
            console.log('Import result:', result);

            if (!response.ok) {
                throw new Error(result.message || 'Import failed');
            }

            alert(`Successfully imported ${result.data.importedTransactions.length} transactions!`);

            // Reset the component state
            setUploadedFiles([]);
            setProcessedData(null);
            setShowResults(false);

        } catch (error) {
            setUploadError(error.message || 'Import failed. Please try again.');
            console.error('Import error:', error);
        } finally {
            setImportingTransactions(false);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const downloadCSV = () => {
        if (!processedData || !processedData.transactions) return;

        const csvContent = [
            ['Date', 'Description', 'Amount', 'Type'],
            ...processedData.transactions.map(txn => [
                txn.date,
                txn.description,
                txn.amount,
                txn.type
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bank-statement-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // If results are shown, render them
    if (showResults && processedData) {
        return (
            <div className="upload-container">
                <div className="upload-padding">
                    <div className="upload-max-width">
                        {/* Header */}
                        <div className="upload-header">
                            <div className="header-content">
                                <h1 className="upload-title">Bank Statement Processed</h1>
                                <p className="upload-subtitle">
                                    Successfully extracted {processedData.transactionsFound} transactions from {processedData.filesProcessed} file(s)
                                    {processedData.errorCount > 0 && ` (${processedData.errorCount} file(s) failed)`}
                                </p>
                                <button
                                    className='back-button'
                                    onClick={() => {
                                        setShowResults(false);
                                        setUploadedFiles([]);
                                        setProcessedData(null);
                                    }}
                                >
                                    ← Back to Upload
                                </button>
                            </div>
                        </div>

                        {/* Results Section */}
                        <div className="upload-card">
                            {/* Account Information */}
                            {processedData.accountInfo && Object.keys(processedData.accountInfo).length > 0 && (
                                <div className="account-info">
                                    <h3>Account Information</h3>
                                    <div className="account-details">
                                        {processedData.accountInfo.bankName && (
                                            <p><strong>Bank:</strong> {processedData.accountInfo.bankName}</p>
                                        )}
                                        {processedData.accountInfo.accountNumber && (
                                            <p><strong>Account Number:</strong> {processedData.accountInfo.accountNumber}</p>
                                        )}
                                        {processedData.accountInfo.statementPeriod && (
                                            <p><strong>Statement Period:</strong> {processedData.accountInfo.statementPeriod.from} to {processedData.accountInfo.statementPeriod.to}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Transactions Preview */}
                            <div className="transactions-preview">
                                <h3>Transactions ({processedData.transactionsFound || 0})</h3>
                                <div className="results-table">
                                    <table className='transaction-table'>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Amount</th>
                                                <th>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {processedData.transactions && Array.isArray(processedData.transactions) ? (
                                                processedData.transactions.map((txn, index) => (
                                                    <tr key={index}>
                                                        <td>{txn.date}</td>
                                                        <td>{txn.description}</td>
                                                        <td>
                                                            {txn.amount >= 0 ? '+' : ''}{txn.amount.toFixed(2)}
                                                        </td>
                                                        <td>
                                                            <span>
                                                                {txn.type}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4">
                                                        No transactions found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                <button
                                    className="action-button primary"
                                    onClick={downloadCSV}
                                >
                                    Download CSV
                                </button>

                                <button
                                    className="action-button success"
                                    onClick={handleImportTransactions}
                                    disabled={importingTransactions}
                                >
                                    {importingTransactions ? (
                                        <>
                                            <Loader2 size={16} className="spinning" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            Import Transactions
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Error Message */}
                            {uploadError && (
                                <div className="error-message">
                                    <AlertCircle size={16} />
                                    {uploadError}
                                </div>
                            )}
                        </div>
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
                                Upload your PDF bank statement files to extract transaction data automatically
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

                        {/* Progress Indicator */}
                        {isUploading && (
                            <div className="upload-progress">
                                <div className="progress-info">
                                    <span>Processing file {uploadProgress.current} of {uploadProgress.total}</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

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
                                            className={`file-item ${fileData.status}`}
                                        >
                                            <div className="file-info">
                                                <div className="file-icon">
                                                    {getFileIcon(fileData.type)}
                                                </div>

                                                <div className="file-details">
                                                    <p className="file-name">{fileData.name}</p>
                                                    <p className="file-size">{formatFileSize(fileData.size)}</p>
                                                    {fileData.status === 'processing' && (
                                                        <p className="file-status">Processing...</p>
                                                    )}
                                                    {fileData.status === 'completed' && (
                                                        <p className="file-status success">Completed</p>
                                                    )}
                                                    {fileData.status === 'error' && (
                                                        <p className="file-status error">Error: {fileData.error}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="file-actions">
                                                {fileData.status === 'processing' && (
                                                    <Loader2 className="status-icon processing spinning" size={16} />
                                                )}
                                                {fileData.status === 'completed' && (
                                                    <CheckCircle className="status-icon success" />
                                                )}
                                                {fileData.status === 'error' && (
                                                    <AlertCircle className="status-icon error" />
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
                                        Process file{uploadedFiles.length > 1 ? 's' : ''}
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
                                    <h4>Transaction Extraction</h4>
                                    <p>Automatically extract transaction data from PDF statements</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <CheckCircle className="icon" />
                                </div>
                                <div className="info-content">
                                    <h4>Import to Account</h4>
                                    <p>Review and import extracted transactions directly to your account</p>
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