const { cleanupFile } = require('../middleware/uploadMiddleware');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

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
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[-–—to]+\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    // New pattern for your format
    /(\d{1,2}\s+\w{3}\s+\d{4})\s+to\s+(\d{1,2}\s+\w{3}\s+\d{4})/i
  ];

  for (const pattern of dateRangePatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        from: match[1],
        to: match[2]
      };
    }
  }

  return null;
};

// Helper function to clean and normalize text
const cleanText = (text) => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .trim();
};

// Helper function to parse amount
const parseAmount = (amountStr) => {
  if (!amountStr) return 0;

  // Remove commas and handle decimal points
  const cleanAmount = amountStr.replace(/,/g, '').replace(/[^\d.-]/g, '');
  const amount = parseFloat(cleanAmount);

  return isNaN(amount) ? 0 : amount;
};

// Helper function to detect transaction type with SBI-specific patterns
const detectTransactionType = (description) => {
  const debitKeywords = [
    'TO TRANSFER', 'DEBIT', 'WITHDRAW', 'PAYMENT', 'PURCHASE',
    'ATM', 'CHARGE', 'FEE', 'CHEQUE', 'CASH WITHDRAWAL',
    'ONLINE TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'UPI',
    '/DR/', 'UPI/DR', 'TRANSFER-UPI', 'POS'
  ];

  const creditKeywords = [
    'BY TRANSFER', 'CREDIT', 'DEPOSIT', 'SALARY', 'INTEREST',
    'REFUND', 'CASHBACK', 'BONUS', 'DIVIDEND', 'RECEIVED',
    '/CR/', 'UPI/CR', 'TRANSFER-UPI/CR'
  ];

  const upperDesc = description.toUpperCase();

  // Check for explicit debit indicators
  for (const keyword of debitKeywords) {
    if (upperDesc.includes(keyword)) {
      return 'debit';
    }
  }

  // Check for explicit credit indicators
  for (const keyword of creditKeywords) {
    if (upperDesc.includes(keyword)) {
      return 'credit';
    }
  }

  // SBI-specific patterns
  if (upperDesc.includes('UPI/DR') || upperDesc.includes('TO TRANSFER-UPI')) {
    return 'debit';
  }

  if (upperDesc.includes('UPI/CR') || upperDesc.includes('BY TRANSFER-UPI')) {
    return 'credit';
  }

  // If description ends with '-' it's usually a debit in SBI
  if (upperDesc.endsWith('-')) {
    return 'debit';
  }

  // Default to debit for 'TO TRANSFER' transactions
  if (upperDesc.includes('TO TRANSFER')) {
    return 'debit';
  }

  return 'unknown';
};

// Improved function to reconstruct transaction lines for SBI format
const reconstructTransactionLines = (text) => {
  console.log('Reconstructing transaction lines for SBI format...');

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const reconstructedLines = [];

  let currentTransaction = '';
  let foundTransactionStart = false;
  let transactionStartIndex = -1;

  // Find the start of transaction data (after headers)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('DebitCreditBalance') ||
      (line.includes('Debit') && line.includes('Credit') && line.includes('Balance'))) {
      transactionStartIndex = i + 1;
      console.log(`Found transaction start at line ${i + 1}`);
      break;
    }
  }

  if (transactionStartIndex === -1) {
    console.log('No transaction header found, using fallback detection');
    transactionStartIndex = 0;
  }

  for (let i = transactionStartIndex; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts a new transaction (starts with date pattern)
    const dateMatch = line.match(/^(\d{1,2}\s+\w{3}\s+\d{4})/);

    if (dateMatch) {
      // If we have a previous transaction, save it
      if (currentTransaction && foundTransactionStart) {
        reconstructedLines.push(currentTransaction.trim());
        console.log(`Completed transaction: "${currentTransaction.trim()}"`);
      }

      // Start new transaction
      currentTransaction = line;
      foundTransactionStart = true;
      console.log(`Started new transaction: "${line}"`);
    } else if (foundTransactionStart) {
      // Continue building current transaction
      currentTransaction += ' ' + line;
      console.log(`Added to transaction: "${line}"`);
    }

    // Check if current line ends with a balance (number pattern)
    const balanceMatch = line.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*$/);
    if (balanceMatch && currentTransaction && foundTransactionStart) {
      reconstructedLines.push(currentTransaction.trim());
      console.log(`Completed transaction with balance: "${currentTransaction.trim()}"`);
      currentTransaction = '';
      foundTransactionStart = false;
    }
  }

  // Add last transaction if exists
  if (currentTransaction && foundTransactionStart) {
    reconstructedLines.push(currentTransaction.trim());
    console.log(`Added final transaction: "${currentTransaction.trim()}"`);
  }

  console.log(`Reconstructed ${reconstructedLines.length} transaction lines`);
  reconstructedLines.forEach((line, index) => {
    console.log(`Reconstructed line ${index + 1}: "${line}"`);
  });

  return reconstructedLines;
};

// Enhanced SBI transaction parser with better pattern matching
// Enhanced SBI transaction parser with better pattern matching
const parseSBITransaction = (line) => {
  try {
    const cleanLine = cleanText(line);
    console.log(`Parsing SBI line: "${cleanLine}"`);

    // Handle the concatenated date format: "1 Jul 20251 Jul 2025"
    // Updated pattern to match concatenated dates
    const datePattern = /^(\d{1,2}\s+\w{3}\s+\d{4})(\d{1,2}\s+\w{3}\s+\d{4})\s*(.+)/;
    const dateMatch = cleanLine.match(datePattern);

    if (!dateMatch) {
      console.log('No date pattern found, trying alternative patterns...');

      // Try alternative pattern for normal format
      const altDatePattern = /^(\d{1,2}\s+\w{3}\s+\d{4})\s+(\d{1,2}\s+\w{3}\s+\d{4})\s+(.+)/;
      const altMatch = cleanLine.match(altDatePattern);

      if (!altMatch) {
        console.log('No alternative date pattern found');
        return null;
      }

      const [, txnDate, valueDate, remainingText] = altMatch;
      return parseTransactionDetails(txnDate, valueDate, remainingText);
    }

    const [, txnDate, valueDate, remainingText] = dateMatch;
    console.log(`Extracted dates: txnDate="${txnDate}", valueDate="${valueDate}"`);
    console.log(`Remaining text: "${remainingText}"`);

    return parseTransactionDetails(txnDate, valueDate, remainingText);

  } catch (err) {
    console.error('Error parsing SBI transaction:', err);
    return null;
  }
};

// Helper function to parse transaction details
const parseTransactionDetails = (txnDate, valueDate, remainingText) => {
  try {
    // Extract balance (last number in the line)
    const balancePattern = /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*$/;
    const balanceMatch = remainingText.match(balancePattern);

    if (!balanceMatch) {
      console.log('No balance found, treating as incomplete transaction');
      return {
        date: txnDate.trim(),
        txnDate: txnDate.trim(),
        valueDate: valueDate.trim(),
        description: remainingText.trim(),
        refNo: '',
        amount: 0,
        balance: 0,
        type: 'unknown',
        debit: '',
        credit: ''
      };
    }

    const balance = balanceMatch[1];
    const beforeBalance = remainingText.substring(0, balanceMatch.index).trim();
    console.log(`Extracted balance: "${balance}"`);
    console.log(`Text before balance: "${beforeBalance}"`);

    // Try to extract amount (second to last number)
    const amountPattern = /(\d+(?:,\d{3})*(?:\.\d{2})?)\s+\d+(?:,\d{3})*(?:\.\d{2})?\s*$/;
    const amountMatch = remainingText.match(amountPattern);

    let amount = '0';
    let description = beforeBalance;

    if (amountMatch) {
      amount = amountMatch[1];
      description = remainingText.substring(0, amountMatch.index).trim();
      console.log(`Extracted amount: "${amount}"`);
      console.log(`Final description: "${description}"`);
    } else {
      // If no amount found, try to extract from description
      // Sometimes amount might be embedded in the description
      const descAmountPattern = /(\d+(?:,\d{3})*(?:\.\d{2})?)/;
      const descAmountMatch = description.match(descAmountPattern);
      if (descAmountMatch) {
        amount = descAmountMatch[1];
        console.log(`Extracted amount from description: "${amount}"`);
      }
    }

    // Determine transaction type
    const txnType = detectTransactionType(description);
    const parsedAmount = parseAmount(amount);

    // Extract reference number from description
    const refNoMatch = description.match(/(\d{12,})/);
    const refNo = refNoMatch ? refNoMatch[1] : '';

    const transaction = {
      date: txnDate.trim(),
      txnDate: txnDate.trim(),
      valueDate: valueDate.trim(),
      description: description.trim(),
      refNo: refNo,
      amount: txnType === 'debit' ? -parsedAmount : parsedAmount,
      balance: parseAmount(balance),
      type: txnType,
      debit: txnType === 'debit' ? amount : '',
      credit: txnType === 'credit' ? amount : ''
    };

    console.log('Successfully parsed transaction:', transaction);
    return transaction;

  } catch (err) {
    console.error('Error parsing transaction details:', err);
    return null;
  }
};

// Alternative parser for SBI format with better reconstruction
const parseSBITransactionAlternative = (line) => {
  try {
    const cleanLine = cleanText(line);
    console.log(`Alternative parsing SBI line: "${cleanLine}"`);

    // Split by spaces and look for date patterns
    const parts = cleanLine.split(/\s+/);
    let txnDate = '', valueDate = '', description = '', balance = '0', amount = '0';

    // Look for date patterns in the first few parts
    for (let i = 0; i < Math.min(parts.length, 6); i++) {
      const part = parts[i];
      if (/^\d{1,2}$/.test(part) && i + 2 < parts.length) {
        // Check if next two parts form a date
        const month = parts[i + 1];
        const year = parts[i + 2];

        if (/^[A-Za-z]{3}$/.test(month) && /^\d{4}$/.test(year)) {
          if (!txnDate) {
            txnDate = `${part} ${month} ${year}`;
          } else if (!valueDate) {
            valueDate = `${part} ${month} ${year}`;
            // Everything after this is description
            description = parts.slice(i + 3).join(' ');
            break;
          }
        }
      }
    }

    if (!txnDate || !valueDate) {
      console.log('Could not extract both dates from line');
      return null;
    }

    console.log(`Extracted: txnDate="${txnDate}", valueDate="${valueDate}", description="${description}"`);

    // Extract balance (last number)
    const balanceMatch = description.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*$/);
    if (balanceMatch) {
      balance = balanceMatch[1];
      description = description.substring(0, balanceMatch.index).trim();
    }

    // Extract amount (second to last number)
    const amountMatch = description.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*$/);
    if (amountMatch) {
      amount = amountMatch[1];
      description = description.substring(0, amountMatch.index).trim();
    }

    const txnType = detectTransactionType(description);
    const parsedAmount = parseAmount(amount);

    const transaction = {
      date: txnDate,
      txnDate: txnDate,
      valueDate: valueDate,
      description: description.trim(),
      refNo: '',
      amount: txnType === 'debit' ? -parsedAmount : parsedAmount,
      balance: parseAmount(balance),
      type: txnType,
      debit: txnType === 'debit' ? amount : '',
      credit: txnType === 'credit' ? amount : ''
    };

    console.log('Successfully parsed with alternative method:', transaction);
    return transaction;

  } catch (err) {
    console.error('Error in alternative parsing:', err);
    return null;
  }
};

// Updated parseTransactionData function
const parseTransactionData = (text) => {
  console.log('Starting enhanced transaction parsing...');

  const transactions = [];

  // First, try to reconstruct complete transaction lines
  const reconstructedLines = reconstructTransactionLines(text);

  if (reconstructedLines.length > 0) {
    console.log('Processing reconstructed lines...');

    for (const line of reconstructedLines) {
      console.log(`Processing reconstructed line: "${line}"`);

      // Try main parser first
      let transaction = parseSBITransaction(line);

      // If main parser fails, try alternative parser
      if (!transaction) {
        console.log('Main parser failed, trying alternative parser...');
        transaction = parseSBITransactionAlternative(line);
      }

      if (transaction) {
        transactions.push(transaction);
        console.log(`Successfully parsed transaction: ${JSON.stringify(transaction)}`);
      } else {
        console.log(`Failed to parse line: "${line}"`);

        // Even if parsing fails, try to extract basic info
        const basicTransaction = extractBasicTransactionInfo(line);
        if (basicTransaction) {
          transactions.push(basicTransaction);
        }
      }
    }
  }

  console.log(`Total transactions parsed: ${transactions.length}`);
  return transactions;
};

// Helper function to extract basic transaction info when parsing fails
const extractBasicTransactionInfo = (line) => {
  try {
    const cleanLine = cleanText(line);

    // Try to extract any dates
    const dateMatches = cleanLine.match(/\d{1,2}\s+\w{3}\s+\d{4}/g);
    if (!dateMatches || dateMatches.length < 1) {
      return null;
    }

    const txnDate = dateMatches[0];
    const valueDate = dateMatches[1] || dateMatches[0];

    // Extract all numbers
    const numberMatches = cleanLine.match(/\d+(?:,\d{3})*(?:\.\d{2})?/g);
    const balance = numberMatches && numberMatches.length > 0 ? numberMatches[numberMatches.length - 1] : '0';
    const amount = numberMatches && numberMatches.length > 1 ? numberMatches[numberMatches.length - 2] : '0';

    // Extract description (everything between dates and numbers)
    let description = cleanLine;
    dateMatches.forEach(date => {
      description = description.replace(date, '');
    });

    if (numberMatches) {
      numberMatches.forEach(num => {
        description = description.replace(num, '');
      });
    }

    description = description.trim().replace(/\s+/g, ' ');

    const txnType = detectTransactionType(description);
    const parsedAmount = parseAmount(amount);

    const transaction = {
      date: txnDate,
      txnDate: txnDate,
      valueDate: valueDate,
      description: description,
      refNo: '',
      amount: txnType === 'debit' ? -parsedAmount : parsedAmount,
      balance: parseAmount(balance),
      type: txnType,
      debit: txnType === 'debit' ? amount : '',
      credit: txnType === 'credit' ? amount : ''
    };

    console.log('Extracted basic transaction info:', transaction);
    return transaction;

  } catch (err) {
    console.error('Error extracting basic transaction info:', err);
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

  // Branch and IFSC patterns
  const branchPatterns = [
    /Branch\s*:\s*([a-zA-Z\s-]+)/i,
    /branch[:\s]+([a-zA-Z\s-]+)/i
  ];

  const ifscPatterns = [
    /IFS\s+Code\s*:\s*([A-Z]{4}[0-9]{7})/i,
    /ifsc[:\s]+([A-Z]{4}[0-9]{7})/i
  ];

  for (const pattern of branchPatterns) {
    const match = text.match(pattern);
    if (match) {
      accountInfo.branchName = match[1].trim();
      break;
    }
  }

  for (const pattern of ifscPatterns) {
    const match = text.match(pattern);
    if (match) {
      accountInfo.ifscCode = match[1];
      break;
    }
  }

  return accountInfo;
};

// MAIN FUNCTION: Upload and process bank statement
const uploadBankStatement = async (req, res) => {
  console.log('=== BANK STATEMENT UPLOAD STARTED ===');

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a PDF file.'
      });
    }

    console.log('File uploaded:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });

    // Extract text from PDF
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    console.log('Extracting text from PDF...');
    const pdfData = await pdf(fileBuffer);
    const extractedText = pdfData.text;

    console.log('PDF text extracted successfully');
    console.log('Text length:', extractedText.length);
    console.log('First 1000 characters:', extractedText.substring(0, 1000));
    console.log('Last 500 characters:', extractedText.substring(extractedText.length - 500));

    // Clean up the uploaded file
    cleanupFile(filePath);

    // Process the extracted text
    const bankName = detectBankFromText(extractedText);
    console.log('Detected bank:', bankName);

    const dateRange = extractDateRange(extractedText);
    console.log('Date range:', dateRange);

    const accountInfo = extractAccountInfo(extractedText);
    console.log('Account info:', accountInfo);

    const transactions = parseTransactionData(extractedText);
    console.log('Parsed transactions:', transactions.length);

    // More detailed debugging if no transactions found
    if (transactions.length === 0) {
      console.log('=== DEBUGGING: No transactions found ===');
      console.log('Extracted text lines:');
      const lines = extractedText.split('\n');
      lines.forEach((line, index) => {
        if (line.trim()) {
          console.log(`Line ${index}: "${line}"`);
        }
      });

      return res.status(400).json({
        success: false,
        message: 'No transactions found in the PDF. The PDF text extraction might be incomplete or the format is not recognized.',
        debug: {
          textLength: extractedText.length,
          totalLines: lines.length,
          bankName,
          dateRange,
          accountInfo,
          sampleLines: lines.slice(0, 20).map((line, i) => `${i}: ${line}`)
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
        bankName,
        ...accountInfo,
        fileName: req.file.originalname,
        processedAt: new Date().toISOString(),
        totalTransactions: transactions.length,
        statementPeriod: dateRange
      }
    };

    console.log('=== PROCESSING COMPLETED SUCCESSFULLY ===');
    console.log('Final result:', {
      bankName,
      transactionsFound: transactions.length,
      accountInfo: processedData.accountInfo
    });

    res.status(200).json({
      success: true,
      message: 'Bank statement processed successfully',
      data: processedData
    });

  } catch (error) {
    console.error('=== ERROR PROCESSING BANK STATEMENT ===');
    console.error('Error details:', error);

    // Clean up file if error occurs
    if (req.file && req.file.path) {
      try {
        cleanupFile(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error processing bank statement',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Process extracted text (kept for compatibility)
const processExtractedText = async (req, res) => {
  console.log('=== PROCESS EXTRACTED TEXT CALLED ===');

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

    const bankName = detectBankFromText(extractedText);
    const dateRange = extractDateRange(extractedText);
    const transactions = parseTransactionData(extractedText);
    const accountInfo = extractAccountInfo(extractedText);

    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions found in the extracted text.',
        debug: {
          textLength: extractedText.length,
          textPreview: extractedText.substring(0, 1000),
          bankName,
          dateRange,
          accountInfo
        }
      });
    }

    const processedData = {
      bankName,
      dateRange,
      transactions,
      transactionsFound: transactions.length,
      accountInfo: {
        bankName,
        ...accountInfo,
        fileName: fileName || 'unknown',
        processedAt: new Date().toISOString(),
        totalTransactions: transactions.length,
        statementPeriod: dateRange
      }
    };

    res.status(200).json({
      success: true,
      message: 'Bank statement processed successfully',
      data: processedData
    });

  } catch (error) {
    console.error('Error processing extracted text:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bank statement',
      error: error.message
    });
  }
};

// Import transactions
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