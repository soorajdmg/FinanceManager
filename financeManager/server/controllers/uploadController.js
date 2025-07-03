const { cleanupFile } = require('../middleware/uploadMiddleware');

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

// Helper function to detect bank from text
const detectBankFromText = (text) => {
  const upperText = text.toUpperCase();
  for (const [bankName, patterns] of Object.entries(bankPatterns)) {
    if (patterns.some(pattern => upperText.includes(pattern))) {
      return bankName;
    }
  }
  return 'UNKNOWN';
};

// Helper function to extract date range
const extractDateRange = (text) => {
  const dateRangePatterns = [
    /Account\s+Statement\s+from\s+(\d{1,2}\s+\w{3}\s+\d{4})\s+to\s+(\d{1,2}\s+\w{3}\s+\d{4})/i,
    /statement\s+from\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+to\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /from\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+to\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /statement\s+from\s+(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    /from\s+(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+to\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(\d{1,2}-\d{1,2}-\d{4})\s+to\s+(\d{1,2}-\d{1,2}-\d{4})/i,
    // More flexible patterns
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[-–—to]+\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
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
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;
  const dates = text.match(datePattern);
  if (dates && dates.length >= 2) {
    return {
      startDate: dates[0],
      endDate: dates[dates.length - 1]
    };
  }

  return null;
};

// Helper function to extract reference number from description
const extractRefNumber = (description) => {
  const refPatterns = [
    /(\d{12,})/,  // Long numbers (12+ digits)
    /\/(\d{10,})\//,  // Numbers between slashes
    /(\d{10,})/,  // Any 10+ digit number
  ];

  for (const pattern of refPatterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return '';
};

// Improved function to parse SBI bank statement format
const parseSBITransaction = (line) => {
  try {
    // Remove extra whitespace and normalize
    const normalizedLine = line.replace(/\s+/g, ' ').trim();
    
    // SBI format: Date Date Description RefNo Amount Balance
    // Example: "1 Jul 2025 1 Jul 2025 TO TRANSFER-UPI/DR/518219314628/Jar/YESB/JARRETAIL@/Collect-TRANSFER TO 4897692162094 30.00 6,795.89"
    
    // Match the pattern: Date Date Description RefNo Amount Balance
    const sbiPattern = /^(\d{1,2}\s+\w{3}\s+\d{4})\s+(\d{1,2}\s+\w{3}\s+\d{4})\s+(.+?)\s+(\d{13,})\s+(\d+(?:\.\d{2})?)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)$/;
    
    const match = normalizedLine.match(sbiPattern);
    if (!match) {
      console.log('No match for line:', normalizedLine);
      return null;
    }

    const [, txnDate, valueDate, description, refNo, amount, balance] = match;
    
    // Determine if it's debit or credit based on description
    const isDebit = description.includes('TO TRANSFER') || description.includes('/DR/');
    const isCredit = description.includes('BY TRANSFER') || description.includes('/CR/');
    
    const parsedAmount = parseFloat(amount);
    
    return {
      txnDate: txnDate.trim(),
      valueDate: valueDate.trim(),
      description: description.trim().replace(/\s+/g, ' '),
      refNo: refNo,
      debit: isDebit ? amount : '',
      credit: isCredit ? amount : '',
      balance: balance.replace(/,/g, ''),
      amount: isDebit ? -parsedAmount : parsedAmount,
      type: isDebit ? 'debit' : 'credit'
    };

  } catch (err) {
    console.log('Error parsing SBI transaction line:', err);
    return null;
  }
};

// Enhanced transaction parsing with improved SBI support
const parseTransactionData = (text) => {
  console.log('Parsing transaction data from text');
  console.log('Text length:', text.length);

  const transactions = [];
  
  // Look for the transaction table header
  const headerPatterns = [
    'Txn Date Value\nDate \nDescription Ref No./Cheque\nNo. \nDebit Credit Balance',
    'Txn Date Value Date Description Ref No./Cheque No. Debit Credit Balance',
    'Txn Date   Value   Description   Ref No./Cheque   Debit   Credit',
    'Transaction Date   Value Date   Description   Reference   Debit   Credit   Balance'
  ];
  
  let transactionSectionStart = -1;
  
  for (const header of headerPatterns) {
    const headerIndex = text.indexOf(header);
    if (headerIndex !== -1) {
      transactionSectionStart = headerIndex + header.length;
      console.log('Found transaction header at index:', headerIndex);
      break;
    }
  }
  
  if (transactionSectionStart === -1) {
    // Try to find transaction data by looking for date patterns
    const datePatternIndex = text.search(/\d{1,2}\s+\w{3}\s+\d{4}\s+\d{1,2}\s+\w{3}\s+\d{4}/);
    if (datePatternIndex !== -1) {
      transactionSectionStart = datePatternIndex;
      console.log('Found transaction data at index:', datePatternIndex);
    }
  }
  
  if (transactionSectionStart !== -1) {
    const transactionText = text.substring(transactionSectionStart);
    console.log('Transaction section found, parsing...');
    console.log('First 500 chars of transaction section:', transactionText.substring(0, 500));
    
    // Split by lines and process each potential transaction line
    const lines = transactionText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and non-transaction lines
      if (trimmedLine.length < 20) continue;
      
      // Check if line starts with a date pattern
      if (!/^\d{1,2}\s+\w{3}\s+\d{4}/.test(trimmedLine)) continue;
      
      console.log('Processing transaction line:', trimmedLine);
      
      // Try SBI-specific parsing first
      let transaction = parseSBITransaction(trimmedLine);
      
      // If SBI parsing fails, try generic parsing
      if (!transaction) {
        transaction = parseGenericTransaction(trimmedLine);
      }
      
      if (transaction) {
        transactions.push(transaction);
        console.log('Successfully parsed transaction:', transaction);
      } else {
        console.log('Failed to parse line:', trimmedLine);
      }
    }
  }
  
  // Fallback: Try to extract transactions using regex patterns
  if (transactions.length === 0) {
    console.log('Trying regex-based parsing...');
    
    // Pattern for SBI format: Date Date Description RefNo Amount Balance
    const sbiRegex = /(\d{1,2}\s+\w{3}\s+\d{4})\s+(\d{1,2}\s+\w{3}\s+\d{4})\s+(.+?)\s+(\d{13,})\s+(\d+(?:\.\d{2})?)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
    
    let match;
    while ((match = sbiRegex.exec(text)) !== null) {
      const [, txnDate, valueDate, description, refNo, amount, balance] = match;
      
      const isDebit = description.includes('TO TRANSFER') || description.includes('/DR/');
      const isCredit = description.includes('BY TRANSFER') || description.includes('/CR/');
      const parsedAmount = parseFloat(amount);
      
      const transaction = {
        txnDate: txnDate.trim(),
        valueDate: valueDate.trim(),
        description: description.trim().replace(/\s+/g, ' '),
        refNo: refNo,
        debit: isDebit ? amount : '',
        credit: isCredit ? amount : '',
        balance: balance.replace(/,/g, ''),
        amount: isDebit ? -parsedAmount : parsedAmount,
        type: isDebit ? 'debit' : 'credit'
      };
      
      transactions.push(transaction);
      console.log('Regex parsed transaction:', transaction);
    }
  }

  console.log('Total parsed transactions:', transactions.length);
  return transactions;
};

// Generic transaction parser as fallback
const parseGenericTransaction = (line) => {
  try {
    // Try to match: Date Description Amount Balance
    const patterns = [
      // Pattern 1: Date Date Description Amount Balance
      /^(\d{1,2}\s+\w{3}\s+\d{4})\s+(\d{1,2}\s+\w{3}\s+\d{4})\s+(.+?)\s+(\d+(?:\.\d{2})?)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)$/,
      // Pattern 2: Date Description Amount Balance
      /^(\d{1,2}\s+\w{3}\s+\d{4})\s+(.+?)\s+(\d+(?:\.\d{2})?)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)$/
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const match = line.match(patterns[i]);
      if (match) {
        let transaction = {};
        
        if (i === 0) {
          // Pattern 1: Date Date Description Amount Balance
          const [, txnDate, valueDate, description, amount, balance] = match;
          transaction = {
            txnDate: txnDate.trim(),
            valueDate: valueDate.trim(),
            description: description.trim(),
            amount: parseFloat(amount),
            balance: balance.replace(/,/g, ''),
            refNo: extractRefNumber(description),
            type: 'unknown',
            debit: '',
            credit: ''
          };
        } else {
          // Pattern 2: Date Description Amount Balance
          const [, txnDate, description, amount, balance] = match;
          transaction = {
            txnDate: txnDate.trim(),
            valueDate: txnDate.trim(),
            description: description.trim(),
            amount: parseFloat(amount),
            balance: balance.replace(/,/g, ''),
            refNo: extractRefNumber(description),
            type: 'unknown',
            debit: '',
            credit: ''
          };
        }
        
        return transaction;
      }
    }
    
    return null;
  } catch (err) {
    console.log('Error in generic transaction parsing:', err);
    return null;
  }
};

// Helper function to extract account information
const extractAccountInfo = (text) => {
  const accountInfo = {};

  // Account number patterns
  const accountNumberPatterns = [
    /Account\s+Number\s*:\s*(\d{4,})/i,
    /account\s+no[:\s]+(\d{4,})/i,
    /account\s+number[:\s]+(\d{4,})/i,
    /a\/c\s+no[:\s]+(\d{4,})/i,
    /account[:\s]+(\d{10,})/i
  ];

  for (const pattern of accountNumberPatterns) {
    const match = text.match(pattern);
    if (match) {
      accountInfo.accountNumber = match[1];
      break;
    }
  }

  // Customer name patterns
  const customerNamePatterns = [
    /Account\s+Name\s*:\s*([^,\n]+)/i,
    /account\s+name[:\s]+([a-zA-Z\s.,]+)/i,
    /customer\s+name[:\s]+([a-zA-Z\s.,]+)/i,
    /name[:\s]+([a-zA-Z\s.,]+)/i
  ];

  for (const pattern of customerNamePatterns) {
    const match = text.match(pattern);
    if (match) {
      accountInfo.customerName = match[1].trim();
      break;
    }
  }

  // Branch information
  const branchPatterns = [
    /Branch\s*:\s*([a-zA-Z\s-]+)/i,
    /branch[:\s]+([a-zA-Z\s-]+)/i,
    /IFS\s+Code\s*:\s*([A-Z]{4}[0-9]{7})/i,
    /ifsc[:\s]+([A-Z]{4}[0-9]{7})/i
  ];

  for (const pattern of branchPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes('IFS') || pattern.source.includes('ifsc')) {
        accountInfo.ifscCode = match[1];
      } else {
        accountInfo.branchName = match[1].trim();
      }
    }
  }

  // Balance information
  const balancePatterns = [
    /Balance\s+as\s+on\s+[^:]+:\s*([\d,]+\.?\d*)/i,
    /opening\s+balance[:\s]+([\d,]+\.?\d*)/i,
    /closing\s+balance[:\s]+([\d,]+\.?\d*)/i
  ];

  for (const pattern of balancePatterns) {
    const match = text.match(pattern);
    if (match) {
      accountInfo.openingBalance = match[1].replace(/,/g, '');
      break;
    }
  }

  return accountInfo;
};

// Process extracted text data (called from frontend)
const processExtractedText = async (req, res) => {
  try {
    const { extractedText, fileName } = req.body;
    const userId = req.user.id;

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: 'No extracted text provided'
      });
    }

    console.log('Processing extracted text, length:', extractedText.length);
    console.log('First 1000 characters:', extractedText.substring(0, 1000));

    // Detect bank
    const bankName = detectBankFromText(extractedText);
    console.log('Detected bank:', bankName);

    // Extract date range
    const dateRange = extractDateRange(extractedText);
    console.log('Date range:', dateRange);

    // Parse transactions using improved logic
    const transactions = parseTransactionData(extractedText);
    console.log('Parsed transactions count:', transactions.length);

    // Extract account info
    const accountInfo = extractAccountInfo(extractedText);
    console.log('Account info:', accountInfo);

    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions found in the extracted text. The PDF might not contain transaction data in a recognizable format.',
        debug: {
          textLength: extractedText.length,
          textPreview: extractedText.substring(0, 1000),
          bankName,
          dateRange,
          accountInfo
        }
      });
    }

    // Prepare response data
    const processedData = {
      bankName,
      dateRange,
      transactions,
      transactionsFound: transactions.length,
      accountInfo: {
        ...accountInfo,
        fileName: fileName || 'unknown',
        processedAt: new Date().toISOString(),
        totalTransactions: transactions.length
      },
      extractedText: extractedText.substring(0, 1000) + '...' // Truncated for response
    };

    res.status(200).json({
      success: true,
      message: 'Bank statement processed successfully',
      data: processedData
    });
    console.log('Processed data sent successfully:', processedData);

  } catch (error) {
    console.error('Error processing extracted text:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bank statement',
      error: error.message
    });
  }
};

// Rest of the functions remain the same...
const uploadBankStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a PDF file.'
      });
    }

    cleanupFile(req.file.path);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully. Please process on the frontend.',
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error uploading bank statement:', error);

    if (req.file && req.file.path) {
      cleanupFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading bank statement',
      error: error.message
    });
  }
};

const importTransactions = async (req, res) => {
  try {
    const { transactions, bankInfo } = req.body;
    const userId = req.user.id;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction data'
      });
    }

    const processedTransactions = transactions.map(txn => ({
      ...txn,
      userId: userId,
      source: 'bank_statement',
      bankName: bankInfo?.bankName || 'Unknown',
      fileName: bankInfo?.accountInfo?.fileName || 'Unknown',
      createdAt: new Date().toISOString(),
      date: txn.txnDate || txn.date,
      amount: typeof txn.amount === 'number' ? txn.amount :
        (txn.debit ? -parseFloat(txn.debit) : parseFloat(txn.credit || 0))
    }));

    res.status(200).json({
      success: true,
      message: `${processedTransactions.length} transactions imported successfully`,
      data: {
        importedTransactions: processedTransactions,
        bankInfo: bankInfo,
        summary: {
          totalTransactions: processedTransactions.length,
          totalDebits: processedTransactions.filter(t => t.amount < 0).length,
          totalCredits: processedTransactions.filter(t => t.amount > 0).length,
          dateRange: bankInfo?.dateRange
        }
      }
    });

  } catch (error) {
    console.error('Error importing transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing transactions',
      error: error.message
    });
  }
};

const getUploadHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    res.status(200).json({
      success: true,
      message: 'Upload history retrieved successfully',
      data: {
        uploads: []
      }
    });

  } catch (error) {
    console.error('Error fetching upload history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upload history',
      error: error.message
    });
  }
};

const validateProcessedData = async (req, res) => {
  try {
    const { processedData } = req.body;

    if (!processedData) {
      return res.status(400).json({
        success: false,
        message: 'No processed data provided'
      });
    }

    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!processedData.transactions || !Array.isArray(processedData.transactions)) {
      validation.isValid = false;
      validation.errors.push('No transactions found');
    }

    if (processedData.transactions.length === 0) {
      validation.isValid = false;
      validation.errors.push('Transaction array is empty');
    }

    if (processedData.transactions.length > 0) {
      const firstTransaction = processedData.transactions[0];
      const requiredFields = ['txnDate', 'description'];

      for (const field of requiredFields) {
        if (!firstTransaction[field]) {
          validation.warnings.push(`Missing ${field} in transactions`);
        }
      }
    }

    if (!processedData.dateRange) {
      validation.warnings.push('Date range not detected');
    }

    if (!processedData.bankName || processedData.bankName === 'UNKNOWN') {
      validation.warnings.push('Bank not detected or unknown');
    }

    res.status(200).json({
      success: true,
      message: 'Data validation complete',
      data: validation
    });

  } catch (error) {
    console.error('Error validating processed data:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating processed data',
      error: error.message
    });
  }
};

module.exports = {
  uploadBankStatement,
  processExtractedText,
  importTransactions,
  getUploadHistory,
  validateProcessedData
};