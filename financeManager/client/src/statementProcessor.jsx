import React, { useState, useCallback, useEffect } from 'react';

const StatementProcessor = ({ uploadedFiles = [] }) => {
    const [processedData, setProcessedData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [bankInfo, setBankInfo] = useState(null);
    const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

    // Load PDF.js library
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            setPdfLibLoaded(true);
        };
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    // Bank patterns for identification
    const bankPatterns = {
        'SBI': ['SBIN', 'STATE BANK', 'SBI', 'SBIN0006399'],
        'HDFC': ['HDFC', 'HDFC BANK'],
        'ICICI': ['ICICI', 'ICIC'],
        'AXIS': ['AXIS', 'UTIB'],
        'KOTAK': ['KOTAK', 'KKBK'],
        'PNB': ['PUNJAB NATIONAL', 'PNB', 'PUNB'],
        'BOB': ['BANK OF BARODA', 'BOB', 'BARB'],
        'CANARA': ['CANARA', 'CNRB'],
        'UNION': ['UNION BANK', 'UBIN'],
        'YES': ['YES BANK', 'YESB']
    };

    const detectBankFromText = (text) => {
        const upperText = text.toUpperCase();
        for (const [bankName, patterns] of Object.entries(bankPatterns)) {
            if (patterns.some(pattern => upperText.includes(pattern))) {
                return bankName;
            }
        }
        return 'UNKNOWN';
    };

    const extractDateRange = (text) => {
        const dateRangePatterns = [
            /statement\s+from\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+to\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
            /from\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+to\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
            /statement\s+from\s+(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i,
            /from\s+(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i,
            /(\d{1,2}\/\d{1,2}\/\d{4})\s+to\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
            /(\d{1,2}-\d{1,2}-\d{4})\s+to\s+(\d{1,2}-\d{1,2}-\d{4})/i
        ];

        for (const pattern of dateRangePatterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    startDate: match[1],
                    endDate: match[2]
                };
            }
        }

        // Try to extract individual dates
        const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g;
        const dates = text.match(datePattern);
        if (dates && dates.length >= 2) {
            return {
                startDate: dates[0],
                endDate: dates[dates.length - 1]
            };
        }

        return null;
    };

    const parseTransactionData = (text) => {
        console.log('Parsing transaction data from text:', text.substring(0, 627));
        
        const transactions = [];
        
        // Look for the transaction section - find where actual transaction data starts
        const transactionSectionStart = text.indexOf(' Txn Date   Value Description   Ref No./Cheque Debit   Credit');
        console.log('Text length:', text);
        console.log('Transaction section start index:', transactionSectionStart);
        if (transactionSectionStart === -1) {
            console.log('Transaction header not found');
            return [];
        }

        // Extract only the transaction data part
        const transactionText = text.substring(transactionSectionStart);
        console.log('Transaction section:', transactionText.substring(0, 200));

        // Split the transaction text by date patterns to identify individual transactions
        // Look for patterns like "1 Jul 2025   1 Jul 2025"
        const transactionPattern = /(\d{1,2}\s+\w{3}\s+\d{4})\s+(\d{1,2}\s+\w{3}\s+\d{4})\s+([^0-9]+?)\s+(\d+(?:\.\d{2})?)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
        
        let match;
        while ((match = transactionPattern.exec(transactionText)) !== null) {
            const [fullMatch, txnDate, valueDate, description, amount, balance] = match;
            
            console.log('Found transaction match:', {
                txnDate,
                valueDate, 
                description: description.trim(),
                amount,
                balance
            });

            // Determine if it's debit or credit based on description
            const desc = description.trim();
            const isDebit = desc.includes('TO TRANSFER') || desc.includes('/DR/');
            const isCredit = desc.includes('BY TRANSFER') || desc.includes('/CR/');

            const transaction = {
                txnDate: txnDate.trim(),
                valueDate: valueDate.trim(),
                description: desc.replace(/\s+/g, ' '),
                refNo: extractRefNumber(desc),
                debit: isDebit ? amount : '',
                credit: isCredit ? amount : '',
                balance: balance.replace(/,/g, '')
            };

            transactions.push(transaction);
        }

        // If the above pattern doesn't work, try a more flexible approach
        if (transactions.length === 0) {
            console.log('Trying alternative parsing method...');
            
            // Look for individual transaction lines in the text
            const lines = transactionText.split(/(?=\d{1,2}\s+\w{3}\s+\d{4})/);
            
            for (let i = 1; i < lines.length; i++) { // Skip first element (header)
                const line = lines[i].trim();
                if (line.length < 20) continue;

                console.log('Processing line:', line.substring(0, 100));

                const transaction = parseTransactionLine(line);
                if (transaction) {
                    transactions.push(transaction);
                }
            }
        }

        console.log('Total parsed transactions:', transactions.length);
        return transactions;
    };

    const parseTransactionLine = (line) => {
        try {
            // Extract date at the beginning
            const dateMatch = line.match(/^(\d{1,2}\s+\w{3}\s+\d{4})\s+(\d{1,2}\s+\w{3}\s+\d{4})/);
            if (!dateMatch) return null;

            const txnDate = dateMatch[1];
            const valueDate = dateMatch[2];

            // Remove dates from the line to get the rest
            let remaining = line.substring(dateMatch[0].length).trim();

            // Extract balance (last number with commas)
            const balanceMatch = remaining.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*$/);
            if (!balanceMatch) return null;

            const balance = balanceMatch[1];
            remaining = remaining.replace(balanceMatch[0], '').trim();

            // Extract transaction amount (second to last number)
            const amountMatch = remaining.match(/(\d+(?:\.\d{2})?)\s*$/);
            if (!amountMatch) return null;

            const amount = amountMatch[1];
            remaining = remaining.replace(amountMatch[0], '').trim();

            // The rest is the description
            const description = remaining.trim();

            // Determine if it's debit or credit
            const isDebit = description.includes('TO TRANSFER') || description.includes('/DR/');
            const isCredit = description.includes('BY TRANSFER') || description.includes('/CR/');

            return {
                txnDate,
                valueDate,
                description: description.replace(/\s+/g, ' '),
                refNo: extractRefNumber(description),
                debit: isDebit ? amount : '',
                credit: isCredit ? amount : '',
                balance: balance.replace(/,/g, '')
            };

        } catch (err) {
            console.log('Error parsing transaction line:', err);
            return null;
        }
    };

    const extractRefNumber = (description) => {
        // Look for reference numbers in the description
        const refPatterns = [
            /(\d{12,})/,  // Long numbers (12+ digits)
            /\/(\d{10,})\//,  // Numbers between slashes
        ];

        for (const pattern of refPatterns) {
            const match = description.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return '';
    };

    const extractTextFromPDF = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function (e) {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
                    let fullText = '';

                    console.log('PDF has', pdf.numPages, 'pages');

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        
                        // Get text items with their positions for better parsing
                        const textItems = textContent.items;
                        let pageText = '';
                        
                        // Sort items by Y position (top to bottom) then X position (left to right)
                        textItems.sort((a, b) => {
                            const yDiff = Math.abs(a.transform[5] - b.transform[5]);
                            if (yDiff > 5) { // Different lines
                                return b.transform[5] - a.transform[5]; // Top to bottom
                            }
                            return a.transform[4] - b.transform[4]; // Left to right
                        });

                        let lastY = null;
                        textItems.forEach(item => {
                            const currentY = item.transform[5];
                            
                            // Add line break if we're on a new line
                            if (lastY !== null && Math.abs(currentY - lastY) > 5) {
                                pageText += '\n';
                            }
                            
                            pageText += item.str + ' ';
                            lastY = currentY;
                        });

                        fullText += pageText + '\n';
                    }

                    console.log('Extracted text length:', fullText.length);
                    console.log('First 1000 characters:', fullText.substring(0, 1000));

                    resolve(fullText);
                } catch (error) {
                    console.error('PDF parsing error:', error);
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const processFile = useCallback(async (file) => {
        if (!pdfLibLoaded) {
            setError('PDF library is still loading. Please wait...');
            return;
        }

        setIsProcessing(true);
        setError('');

        console.log('Processing file:', file);

        try {
            let text = '';

            // Handle different file types
            const actualFile = file.file || file;
            const fileName = file.name || actualFile.name;
            const fileType = file.type || actualFile.type;

            console.log('File name:', fileName);
            console.log('File type:', fileType);

            if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
                console.log('Processing as PDF file');
                text = await extractTextFromPDF(actualFile);
            } else {
                console.log('Processing as text/CSV file');
                text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(actualFile);
                });
            }

            // Detect bank
            const bankName = detectBankFromText(text);
            console.log('Detected bank:', bankName);

            // Extract date range
            const dateRange = extractDateRange(text);
            console.log('Extracted date range:', dateRange);

            // Parse transactions
            const transactions = parseTransactionData(text);
            console.log('Parsed transactions:', transactions.length);

            if (transactions.length === 0) {
                throw new Error('No transactions found in the file. Please check if the PDF contains transaction data.');
            }

            const bankData = {
                bankName,
                dateRange,
                transactions,
                accountInfo: {
                    fileName: fileName,
                    processedAt: new Date().toISOString(),
                    totalTransactions: transactions.length
                }
            };

            setBankInfo(bankData);
            setProcessedData(bankData);

            // Automatically download the processed file
            downloadProcessedFile(bankData);

        } catch (err) {
            setError(`Error processing file: ${err.message}`);
            console.error('Processing error:', err);
        } finally {
            setIsProcessing(false);
        }
    }, [pdfLibLoaded]);

    const generateCSVContent = (data) => {
        const headers = [
            'Transaction Date',
            'Value Date',
            'Description',
            'Reference Number',
            'Debit',
            'Credit',
            'Balance'
        ];

        const csvRows = [headers.join(',')];

        data.transactions.forEach(transaction => {
            const row = [
                `"${transaction.txnDate}"`,
                `"${transaction.valueDate}"`,
                `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes in description
                `"${transaction.refNo}"`,
                transaction.debit || '',
                transaction.credit || '',
                transaction.balance || ''
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    };

    const generateFileName = (data) => {
        const bankName = data.bankName.toLowerCase();
        let dateStr = '';

        if (data.dateRange) {
            try {
                const startDate = new Date(data.dateRange.startDate);
                const endDate = new Date(data.dateRange.endDate);

                if (!isNaN(startDate) && !isNaN(endDate)) {
                    const formatDate = (date) => {
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const year = date.getFullYear();
                        return `${month}${year}`;
                    };

                    const startStr = formatDate(startDate);
                    const endStr = formatDate(endDate);

                    dateStr = startStr === endStr ? `_${startStr}` : `_${startStr}_to_${endStr}`;
                }
            } catch (e) {
                console.log('Date parsing error:', e);
            }
        }

        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${bankName}_statement${dateStr}_${timestamp}.csv`;
    };

    const downloadProcessedFile = (data = processedData) => {
        if (!data) return;

        const csvContent = generateCSVContent(data);
        const fileName = generateFileName(data);

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    // Filter for supported file types (CSV and PDF)
    const supportedFiles = uploadedFiles.filter(file =>
        file.file?.type === 'text/csv' ||
        file.type === 'text/csv' ||
        file.name?.toLowerCase().endsWith('.csv') ||
        file.file?.type === 'application/pdf' ||
        file.type === 'application/pdf' ||
        file.name?.toLowerCase().endsWith('.pdf')
    );

    // Auto-process files when available
    useEffect(() => {
        if (supportedFiles.length > 0 && !isProcessing && !processedData && pdfLibLoaded) {
            processFile(supportedFiles[0]);
        }
    }, [supportedFiles, isProcessing, processedData, pdfLibLoaded, processFile]);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {!pdfLibLoaded && (
                <div style={{ color: 'blue', marginBottom: '10px' }}>
                    Loading PDF processing library...
                </div>
            )}

            {error && (
                <div style={{ color: 'red', marginBottom: '10px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {isProcessing && (
                <div style={{ color: 'orange', marginBottom: '10px' }}>
                    Processing bank statement... This may take a few moments.
                </div>
            )}

            {processedData && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid green', borderRadius: '4px', backgroundColor: '#f0fff0' }}>
                    <h3 style={{ color: 'green', margin: '0 0 10px 0' }}>✓ Processing Complete</h3>
                    <p><strong>Bank:</strong> {bankInfo.bankName}</p>
                    <p><strong>Period:</strong> {bankInfo.dateRange ?
                        `${bankInfo.dateRange.startDate} to ${bankInfo.dateRange.endDate}` :
                        'Date range not detected'
                    }</p>
                    <p><strong>Transactions:</strong> {bankInfo.accountInfo.totalTransactions}</p>
                    <p><strong>File downloaded:</strong> {generateFileName(bankInfo)}</p>

                    <div style={{ marginTop: '15px' }}>
                        <button
                            onClick={() => downloadProcessedFile()}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Download CSV Again
                        </button>
                    </div>

                    {/* Show first few transactions as preview */}
                    {bankInfo.transactions.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <h4>Transaction Preview (First 3):</h4>
                            <div style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                                {bankInfo.transactions.slice(0, 3).map((txn, idx) => (
                                    <div key={idx} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                                        <div><strong>Date:</strong> {txn.txnDate}</div>
                                        <div><strong>Description:</strong> {txn.description}</div>
                                        <div><strong>Amount:</strong> {txn.debit ? `Debit: ${txn.debit}` : `Credit: ${txn.credit}`}</div>
                                        <div><strong>Balance:</strong> {txn.balance}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {supportedFiles.length === 0 && pdfLibLoaded && (
                <div style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '4px', textAlign: 'center' }}>
                    <p>Please upload a CSV or PDF bank statement file.</p>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Supported formats: .pdf, .csv
                    </p>
                </div>
            )}
        </div>
    );
};

export default StatementProcessor;