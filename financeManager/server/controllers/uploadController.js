const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { cleanupFile } = require('../middleware/uploadMiddleware');

// Helper function to extract transaction data from PDF text
const extractTransactionData = (text) => {
  const transactions = [];
  const lines = text.split('\n');
  
  // Common bank statement patterns (you may need to adjust based on your bank formats)
  const transactionPatterns = [
    // Pattern 1: Date Amount Description (DD/MM/YYYY or DD-MM-YYYY)
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+([+-]?\d+\.?\d*)\s+(.+)/,
    // Pattern 2: Date Description Amount
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(.+?)\s+([+-]?\d+\.?\d*)$/,
    // Pattern 3: Description Date Amount
    /(.+?)\s+(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+([+-]?\d+\.?\d*)$/
  ];
  
  const balancePattern = /balance[:\s]+([+-]?\d+\.?\d*)/i;
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    // Try each transaction pattern
    for (const pattern of transactionPatterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        try {
          let date, description, amount;
          
          if (pattern === transactionPatterns[0]) {
            // Pattern 1: Date Amount Description
            date = match[1];
            amount = parseFloat(match[2]);
            description = match[3].trim();
          } else if (pattern === transactionPatterns[1]) {
            // Pattern 2: Date Description Amount
            date = match[1];
            description = match[2].trim();
            amount = parseFloat(match[3]);
          } else {
            // Pattern 3: Description Date Amount
            description = match[1].trim();
            date = match[2];
            amount = parseFloat(match[3]);
          }
          
          // Validate extracted data
          if (!isNaN(amount) && description.length > 0) {
            // Convert date to ISO format
            const dateParts = date.split(/[\/\-]/);
            const isoDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
            
            transactions.push({
              date: isoDate,
              description: description,
              amount: amount,
              type: amount >= 0 ? 'credit' : 'debit'
            });
          }
        } catch (error) {
          console.log('Error parsing transaction:', error);
          continue;
        }
        break; // Stop trying other patterns if one matches
      }
    }
  }
  
  return transactions;
};

// Helper function to extract account information
const extractAccountInfo = (text) => {
  const accountInfo = {};
  
  // Account number pattern
  const accountNumberPattern = /account[:\s]+(\d{4,})/i;
  const accountMatch = text.match(accountNumberPattern);
  if (accountMatch) {
    accountInfo.accountNumber = accountMatch[1];
  }
  
  // Bank name pattern
  const bankNamePattern = /bank[:\s]+([a-zA-Z\s]+)/i;
  const bankMatch = text.match(bankNamePattern);
  if (bankMatch) {
    accountInfo.bankName = bankMatch[1].trim();
  }
  
  // Statement period pattern
  const periodPattern = /statement period[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+to\s+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;
  const periodMatch = text.match(periodPattern);
  if (periodMatch) {
    accountInfo.statementPeriod = {
      from: periodMatch[1],
      to: periodMatch[2]
    };
  }
  
  return accountInfo;
};

// Main upload handler
const uploadBankStatement = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a PDF file.'
      });
    }
    
    const filePath = req.file.path;
    const userId = req.user.id;
    
    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(pdfBuffer);
    
    // Extract text from PDF
    const extractedText = pdfData.text;
    
    // Extract transaction data
    const transactions = extractTransactionData(extractedText);
    const accountInfo = extractAccountInfo(extractedText);
    
    // Clean up the uploaded file
    cleanupFile(filePath);
    
    // Return extracted data
    res.status(200).json({
      success: true,
      message: 'Bank statement processed successfully',
      data: {
        fileName: req.file.originalname,
        accountInfo: accountInfo,
        transactionsFound: transactions.length,
        transactions: transactions,
        extractedText: extractedText.substring(0, 500) + '...' // First 500 chars for reference
      }
    });
    
  } catch (error) {
    console.error('Error processing bank statement:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      cleanupFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing bank statement',
      error: error.message
    });
  }
};

// Import transactions from processed bank statement
const importTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;
    const userId = req.user.id;
    
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction data'
      });
    }
    
    // Here you would typically save transactions to your database
    // For now, we'll just return the processed transactions
    const processedTransactions = transactions.map(txn => ({
      ...txn,
      userId: userId,
      source: 'bank_statement',
      createdAt: new Date().toISOString()
    }));
    
    res.status(200).json({
      success: true,
      message: `${processedTransactions.length} transactions imported successfully`,
      data: {
        importedTransactions: processedTransactions
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

// Get upload history
const getUploadHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Here you would typically fetch upload history from database
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      message: 'Upload history retrieved successfully',
      data: {
        uploads: [] // This would contain actual upload history from database
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

module.exports = {
  uploadBankStatement,
  importTransactions,
  getUploadHistory
};