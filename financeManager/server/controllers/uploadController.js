const { cleanupFile } = require('../middleware/uploadMiddleware');
const { createTransaction } = require('../controllers/txnController');
const Transaction = require('../models/txnModel');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const axios = require('axios');

// Bank patterns for identification
const bankPatterns = {
  'SBI': ['SBIN', 'STATE BANK', 'SBI', 'SBIN0006399'],
  'HDFC Bank': ['HDFC', 'HDFC BANK'],
  'ICICI Bank': ['ICICI', 'ICIC'],
  'Federal Bank': ['FEDERAL', 'FDRL'],
  'Axis Bank': ['AXIS', 'UTIB'],
  'Kotak Bank': ['KOTAK', 'KKBK'],
  'PNB': ['PUNJAB NATIONAL', 'PNB', 'PUNB'],
  'Bank of Baroda': ['BANK OF BARODA', 'BOB', 'BARB'],
  'Canara Bank': ['CANARA', 'CNRB'],
  'Union Bank': ['UNION BANK', 'UBIN'],
  'Yes Bank': ['YES BANK', 'YESB', 'YE SB']
};

// Category mapping based on merchant/recipient names
const categoryPatterns = {
  'Shopping': ['Kattoor', 'Amazon', 'Flipkart', 'Myntra', 'More', 'Vmmart', 'Vm mart', 'Lulu', 'Adidas', 'Marginfr', 'Myg', 'Reliance', 'Trends', 'Zudio'],
  'Food': ['De cake', 'Brufia', 'kfc', 'Utsav', 'Thomson', 'Al baike', 'Thaza fa', 'King foo', 'M S KOTT', 'NORTH EX'],
  'Fuel': ['petrol', 'Shekhar ', 'Sekhar f', 'Kuttanad', 'Hpcl', 'Jaya fuels', 'Mohan fu', 'Olaketty', 'MS PETRO'],
  'Movie': ['Bookmyshow', 'Ganam'],
  'Recharge': ['Jio'],
  'Pappa': ['Murugara', 'MURU GARA'],
  'College': ['Cusat', 'Abin', 'M c', 'Abhinav  a', 'Cucek', 'Aashin m', 'Sajumon', 'Mrs  san', 'Santhosh'],
  'Withdrawal': ['Atm'],
  'Travel': ['Indian r', 'Irctc', 'Abhibus', 'Ixigo'],
  'Investment': ['PHONEP E', 'JAR', 'SAFE GOLD']
};

// Helper function to extract recipient/payer and bank from UPI transaction
const extractUPIDetails = (description) => {
  const upperDesc = description.toUpperCase();

  // Pattern 1: TO TRANSFER- UPI/DR/769299123210/VM MART/SBIN/HSBIMOPAD./Pay men- TRANSFER TO 4897694162092
  const upiPattern1 = /UPI\/[DC]R\/\d+\/([^\/]+)\/([A-Z]{2,4})\s*([A-Z]{2})\//i;
  const match1 = upperDesc.match(upiPattern1);

  if (match1) {
    return {
      recipient: match1[1].trim(),
      bank: detectBankFromText(match1[2].trim() + match1[3].trim())  // This will map "SBIN" to "SBI"
    };
  }

  // Pattern 2: TO TRANSFER-MARGIN MONEY SOORAJ- TRANSFER TO 37608337103
  const transferPattern = /TO TRANSFER-([^-]+)-/i;
  const match2 = upperDesc.match(transferPattern);

  if (match2) {
    return {
      recipient: match2[1].trim(),
      bank: null
    };
  }

  // Pattern 3: BY TRANSFER (for credits)
  const byTransferPattern = /BY TRANSFER[^A-Z]*([A-Z\s]+)/i;
  const match3 = upperDesc.match(byTransferPattern);

  if (match3) {
    return {
      recipient: match3[1].trim(),
      bank: null
    };
  }

  return {
    recipient: null,
    bank: null
  };
};

// Helper function to categorize transaction based on recipient
const categorizeTransaction = (recipient, description) => {
  if (!recipient) {
    // Fallback categorization based on description keywords
    const upperDesc = description.toUpperCase();

    if (upperDesc.includes('ATM')) return 'Withdrawal';
    if (upperDesc.includes('SALARY') || upperDesc.includes('INTEREST')) return 'Income';
    if (upperDesc.includes('CHARGE') || upperDesc.includes('FEE')) return 'Bank Charges';

    return 'Personal';
  }

  const upperRecipient = recipient.toUpperCase();

  // Check each category
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(pattern => upperRecipient.includes(pattern.toUpperCase()))) {
      return category;
    }
  }

  return 'Personal';
};

// Helper function to detect bank from text
const detectBankFromText = (text) => {
  const upperText = text.toUpperCase();
  for (const [bankName, patterns] of Object.entries(bankPatterns)) {
    if (patterns.some(pattern => upperText.includes(pattern))) {
      return bankName;
    }
  }
  return text;
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

// Helper function to parse amount - handles Indian number format
const parseAmount = (amountStr) => {
  if (!amountStr) return 0;

  // Remove commas and handle decimal points
  const cleanAmount = amountStr.replace(/,/g, '').replace(/[^\d.-]/g, '');
  const amount = parseFloat(cleanAmount);

  return isNaN(amount) ? 0 : amount;
};

// Updated transaction type detection for SBI
const detectTransactionType = (description) => {
  const upperDesc = description.toUpperCase();

  // Primary SBI-specific patterns
  if (upperDesc.includes('TO TRANSFER')) {
    return 'debit';
  }

  if (upperDesc.includes('BY TRANSFER')) {
    return 'credit';
  }

  // Secondary patterns
  const debitKeywords = [
    'DEBIT', 'WITHDRAW', 'PAYMENT', 'PURCHASE',
    'ATM', 'CHARGE', 'FEE', 'CHEQUE', 'CASH WITHDRAWAL',
    'ONLINE TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'UPI',
    '/DR/', 'UPI/DR', 'TRANSFER-UPI', 'POS'
  ];

  const creditKeywords = [
    'CREDIT', 'DEPOSIT', 'SALARY', 'INTEREST',
    'REFUND', 'CASHBACK', 'BONUS', 'DIVIDEND', 'RECEIVED',
    '/CR/', 'UPI/CR', 'TRANSFER-UPI/CR'
  ];

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

  return 'unknown';
};

// Enhanced function to reconstruct transaction lines for SBI format
const reconstructTransactionLines = (text) => {
  console.log('Reconstructing transaction lines for SBI format...');

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const reconstructedLines = [];

  let currentTransaction = '';
  let transactionStartIndex = -1;

  // Find the start of transaction data (after headers)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('DebitCreditBalance') ||
      (line.includes('Debit') && line.includes('Credit') && line.includes('Balance')) ||
      line.includes('Transaction DateValue Date')) {
      transactionStartIndex = i + 1;
      console.log(`Found transaction start at line ${i + 1}`);
      break;
    }
  }

  if (transactionStartIndex === -1) {
    console.log('No transaction header found, scanning for first transaction');
    // Look for first line that starts with a date
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^\d{1,2}\s+\w{3}\s+\d{4}/)) {
        transactionStartIndex = i;
        console.log(`Found first transaction at line ${i + 1}`);
        break;
      }
    }
  }

  if (transactionStartIndex === -1) {
    console.log('No transactions found');
    return [];
  }

  for (let i = transactionStartIndex; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and footer text
    if (!line.trim() ||
      line.includes('Please do not share your ATM') ||
      line.includes('This is a computer generated statement') ||
      line.includes('Txn DateValue Date DescriptionRef No')) {
      continue;
    }

    // Check if this line starts a new transaction
    const dateMatch = line.match(/^(\d{1,2}\s+\w{3}\s+\d{4})/);

    if (dateMatch) {
      // If we have a previous transaction, save it
      if (currentTransaction) {
        reconstructedLines.push(currentTransaction.trim());
        console.log(`Completed transaction: "${currentTransaction.trim()}"`);
      }

      // Start new transaction
      currentTransaction = line;
      console.log(`Started new transaction: "${line}"`);

      // Check for multiple date patterns in the same line
      const allDateMatches = [...line.matchAll(/(\d{1,2}\s+\w{3}\s+\d{4})/g)];

      if (allDateMatches.length > 1) {
        console.log(`Found ${allDateMatches.length} dates in line`);

        // Find positions of all dates
        const datePositions = allDateMatches.map(match => ({
          index: match.index,
          date: match[0],
          length: match[0].length
        }));

        // Split into separate transactions, but be smarter about it
        let transactions = [];

        // Group dates in pairs (transaction date + value date)
        for (let j = 0; j < datePositions.length; j += 2) {
          const start = datePositions[j].index;
          const end = j + 2 < datePositions.length ? datePositions[j + 2].index : line.length;

          const transactionText = line.substring(start, end).trim();

          // Only add if it looks like a complete transaction (has amounts)
          if (transactionText && transactionText.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})?/)) {
            transactions.push(transactionText);
          }
        }

        if (transactions.length > 1) {
          // Add all but the last transaction
          for (let j = 0; j < transactions.length - 1; j++) {
            reconstructedLines.push(transactions[j]);
            console.log(`Added split transaction: "${transactions[j]}"`);
          }

          // Set the last transaction as current
          currentTransaction = transactions[transactions.length - 1] || '';
        }
      }

      // Check if this line contains a complete transaction
      const completePattern = /^\d{1,2}\s+\w{3}\s+\d{4}.+?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/;

      if (completePattern.test(currentTransaction)) {
        reconstructedLines.push(currentTransaction.trim());
        console.log(`Complete transaction in single line: "${currentTransaction.trim()}"`);
        currentTransaction = '';
      }
    } else if (currentTransaction) {
      // This line is a continuation of the current transaction
      currentTransaction += ' ' + line;
      console.log(`Added to transaction: "${line}"`);

      // Check if this line completes the transaction
      const endingPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/;

      if (endingPattern.test(currentTransaction)) {
        reconstructedLines.push(currentTransaction.trim());
        console.log(`Completed transaction: "${currentTransaction.trim()}"`);
        currentTransaction = '';
      }
    }
  }

  // Add last transaction if it exists
  if (currentTransaction) {
    reconstructedLines.push(currentTransaction.trim());
    console.log(`Added final transaction: "${currentTransaction.trim()}"`);
  }

  console.log(`Reconstructed ${reconstructedLines.length} transaction lines`);
  return reconstructedLines;
};

// Updated SBI transaction parser with improved date handling
const parseSBITransaction = (line) => {
  try {
    const cleanLine = cleanText(line);
    console.log(`Parsing SBI line: "${cleanLine}"`);

    // Handle different date formats:
    // 1. Concatenated: "1 Jul 20251 Jul 2025"
    // 2. Normal: "1 Jul 2025 1 Jul 2025"
    // 3. Single date: "1 Jul 2025"

    let datePattern, match;
    let txnDate = '';
    let valueDate = '';
    let remainingText = '';

    // Try concatenated format first: "1 Jul 20251 Jul 2025"
    datePattern = /^(\d{1,2}\s+\w{3}\s+\d{4})(\d{1,2}\s+\w{3}\s+\d{4})\s*(.+)/;
    match = cleanLine.match(datePattern);

    // Skip lines that contain only a date (incomplete transactions)
    if (cleanLine.match(/^\d{1,2}\s+\w{3}\s+\d{4}$/)) {
      console.log('Skipping line with only date - likely incomplete transaction');
      return null;
    }

    // Try concatenated format first: "1 Jul 20251 Jul 2025" (no space between dates)
    datePattern = /^(\d{1,2}\s+\w{3}\s+\d{4})(\d{1,2}\s+\w{3}\s+\d{4})(.+)/;
    match = cleanLine.match(datePattern);

    if (match) {
      txnDate = match[1];
      valueDate = match[2];
      remainingText = match[3];
      console.log(`Concatenated dates found: txnDate="${txnDate}", valueDate="${valueDate}"`);
    } else {
      // Try normal format: "1 Jul 2025 1 Jul 2025" (with space between dates)
      datePattern = /^(\d{1,2}\s+\w{3}\s+\d{4})\s+(\d{1,2}\s+\w{3}\s+\d{4})\s+(.+)/;
      match = cleanLine.match(datePattern);

      if (match) {
        txnDate = match[1];
        valueDate = match[2];
        remainingText = match[3];
        console.log(`Normal dates found: txnDate="${txnDate}", valueDate="${valueDate}"`);
      } else {
        // Try single date format: "1 Jul 2025" followed by transaction details
        datePattern = /^(\d{1,2}\s+\w{3}\s+\d{4})\s+(.+)/;
        match = cleanLine.match(datePattern);

        if (match) {
          txnDate = match[1];
          valueDate = match[1]; // Same as transaction date
          remainingText = match[2];
          console.log(`Single date found: txnDate="${txnDate}"`);
        } else {
          // Try date immediately followed by text (no space): "1 Jul 2025BY TRANSFER"
          datePattern = /^(\d{1,2}\s+\w{3}\s+\d{4})(.+)/;
          match = cleanLine.match(datePattern);

          if (match) {
            txnDate = match[1];
            valueDate = match[1];
            remainingText = match[2];
            console.log(`Date immediately followed by text: txnDate="${txnDate}"`);
          } else {
            console.log('No date pattern found');
            return null;
          }
        }
      }
    }

    // Check if remaining text is empty or too short
    if (!remainingText || remainingText.trim().length < 10) {
      console.log('Remaining text too short or empty, skipping transaction');
      return null;
    }
    console.log(`Remaining text after date extraction: "${remainingText}"`);

    return parseTransactionDetails(txnDate, valueDate, remainingText);

  } catch (err) {
    console.error('Error parsing SBI transaction:', err);
    return null;
  }
};

// Updated helper function to parse transaction details with better amount/balance extraction
const parseTransactionDetails = (txnDate, valueDate, remainingText) => {
  try {
    console.log(`Parsing transaction details for: "${remainingText}"`);

    // Check if this text contains additional dates that might be from next transaction
    const additionalDatePattern = /(\d{1,2}\s+\w{3}\s+\d{4})/g;
    const dateMatches = [...remainingText.matchAll(additionalDatePattern)];

    if (dateMatches.length > 0) {
      console.log(`Found ${dateMatches.length} additional dates in remaining text`);

      // Find the position of the first additional date
      const firstAdditionalDate = dateMatches[0];
      const datePosition = firstAdditionalDate.index;

      // Extract only the text before the first additional date
      let firstTransactionText = remainingText.substring(0, datePosition).trim();

      // However, if the additional date appears near the end (likely part of footer text),
      // we might want to include more of the transaction
      if (datePosition > remainingText.length * 0.7) {
        console.log('Additional date appears near end, might be footer text');
        firstTransactionText = remainingText;
      }

      console.log(`First transaction text: "${firstTransactionText}"`);

      // If first transaction text is too short, treat as single transaction
      if (firstTransactionText.length < 20) {
        console.log('First transaction text too short, treating as single transaction');
        return parseSingleTransaction(txnDate, valueDate, remainingText);
      }

      // Parse only the first transaction
      return parseSingleTransaction(txnDate, valueDate, firstTransactionText);
    }

    // If no additional dates found, parse as single transaction
    return parseSingleTransaction(txnDate, valueDate, remainingText);

  } catch (err) {
    console.error('Error parsing transaction details:', err);
    return null;
  }
};

// NEW: Helper function to parse a single transaction
const parseSingleTransaction = (txnDate, valueDate, transactionText) => {
  try {
    console.log(`Parsing single transaction: "${transactionText}"`);

    // First, clean up the transaction text by removing common footer text
    let cleanedText = transactionText
      .replace(/with anyone over mail, SMS, phone call or any other media\. Bank never asks for such information\./gi, '')
      .replace(/Please do not share your ATM.*?Bank never asks for such information\./gi, '')
      .replace(/\*\*This is a computer generated statement.*$/gi, '')
      .replace(/Txn DateValue Date DescriptionRef No\.\/Cheque No\. DebitCreditBalance.*$/gi, '')
      .trim();

    console.log(`Cleaned text: "${cleanedText}"`);

    // Updated pattern to handle comma-separated amounts properly with concatenated amounts
    // This pattern looks for: description + amount (with commas) + balance (with commas)
    const amountBalancePattern = /(.+?)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/;
    const match = cleanedText.match(amountBalancePattern);

    let description = cleanedText;
    let amount = '0.00';
    let balance = '0.00';

    if (match) {
      description = match[1].trim();
      amount = match[2];
      balance = match[3];

      console.log(`Successfully extracted: description="${description}", amount="${amount}", balance="${balance}"`);
    } else {
      // Try pattern for concatenated amounts: "4,894.008,308.14" or "53,000.0059,815.89"
      const concatenatedPattern = /(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})(\d{1,3}(?:,\d{3})*\.\d{2})\s*$/;
      const concatMatch = cleanedText.match(concatenatedPattern);

      if (concatMatch) {
        description = concatMatch[1].trim();
        amount = concatMatch[2];
        balance = concatMatch[3];
        console.log(`Concatenated amounts extracted: description="${description}", amount="${amount}", balance="${balance}"`);
      } else {
        console.log('No amount pattern found, using full text as description');
        // Try to extract any reference number for logging
        const refPattern = /(\d{12,})/;
        const refMatch = cleanedText.match(refPattern);
        if (refMatch) {
          console.log(`Found reference number: ${refMatch[1]}`);
        }
      }
    }

    // Determine transaction type based on SBI-specific patterns
    const txnType = detectTransactionType(description);
    const parsedAmount = parseAmount(amount);

    // Extract reference number from description
    const refNoPattern = /(\d{12,})/;
    const refNoMatch = description.match(refNoPattern);
    const refNo = refNoMatch ? refNoMatch[1] : '';

    // Extract UPI details
    const upiDetails = extractUPIDetails(description);

    // Determine category
    const category = categorizeTransaction(upiDetails.recipient, description);

    // Clean up description by removing extra spaces
    description = description.replace(/\s+/g, ' ').trim();

    const transaction = {
      date: txnDate.trim(),
      txnDate: txnDate.trim(),
      valueDate: valueDate.trim(),
      description: description,
      refNo: refNo,
      amount: txnType === 'debit' ? -parsedAmount : parsedAmount,
      balance: parseAmount(balance),
      type: txnType,
      debit: txnType === 'debit' ? amount : '',
      credit: txnType === 'credit' ? amount : '',
      rawAmount: amount,
      rawBalance: balance,
      recipient: upiDetails.recipient,
      recipientBank: upiDetails.bank,
      category: category
    };

    console.log('Successfully parsed single transaction:', transaction);
    return transaction;

  } catch (err) {
    console.error('Error parsing single transaction:', err);
    return null;
  }
};

// NEW: Helper function to split multiple transactions from a single line
const splitMultipleTransactions = (line) => {
  const transactions = [];
  const datePattern = /(\d{1,2}\s+\w{3}\s+\d{4})/g;
  const datePositions = [];
  let match;

  // Find all date positions
  while ((match = datePattern.exec(line)) !== null) {
    datePositions.push({
      index: match.index,
      date: match[0],
      length: match[0].length
    });
  }

  console.log(`Found ${datePositions.length} date positions for splitting`);

  // Split based on date positions, but group consecutive dates (txnDate + valueDate)
  for (let i = 0; i < datePositions.length; i += 2) {
    const start = datePositions[i].index;
    const end = i + 2 < datePositions.length ? datePositions[i + 2].index : line.length;

    const transactionText = line.substring(start, end).trim();
    if (transactionText && transactionText.length > 20) { // Ensure it's substantial
      transactions.push(transactionText);
      console.log(`Split transaction: "${transactionText}"`);
    }
  }

  return transactions;
};

// Enhanced parseTransactionData function with better debugging
const parseTransactionData = (text) => {
  console.log('Starting enhanced transaction parsing...');
  console.log('Input text length:', text.length);

  const transactions = [];

  // First, try to reconstruct complete transaction lines
  // First, try to reconstruct complete transaction lines
  const reconstructedLines = reconstructTransactionLines(text);

  if (reconstructedLines.length > 0) {
    console.log(`Processing ${reconstructedLines.length} reconstructed lines...`);

    for (let i = 0; i < reconstructedLines.length; i++) {
      const line = reconstructedLines[i];
      console.log(`\n=== Processing line ${i + 1}/${reconstructedLines.length} ===`);
      console.log(`Line: "${line}"`);

      // NEW: Check if this line contains multiple transactions
      const additionalDatePattern = /(\d{1,2}\s+\w{3}\s+\d{4})/g;
      const dateMatches = line.match(additionalDatePattern);

      if (dateMatches && dateMatches.length > 2) { // More than 2 dates means multiple transactions
        console.log(`Line contains ${dateMatches.length} dates - splitting into multiple transactions`);

        // Split the line into separate transactions
        const splitTransactions = splitMultipleTransactions(line);

        for (let j = 0; j < splitTransactions.length; j++) {
          const splitLine = splitTransactions[j];
          console.log(`Processing split transaction ${j + 1}: "${splitLine}"`);

          const transaction = parseSBITransaction(splitLine);
          if (transaction) {
            transactions.push(transaction);
            console.log(`✓ Successfully parsed split transaction ${j + 1}:`, {
              date: transaction.date,
              description: transaction.description.substring(0, 50) + '...',
              amount: transaction.amount,
              balance: transaction.balance,
              type: transaction.type
            });
          }
        }
      } else {
        // Try main parser for single transaction
        const transaction = parseSBITransaction(line);

        if (transaction) {
          transactions.push(transaction);
          console.log(`✓ Successfully parsed transaction ${i + 1}:`, {
            date: transaction.date,
            description: transaction.description.substring(0, 50) + '...',
            amount: transaction.amount,
            balance: transaction.balance,
            type: transaction.type
          });
        } else {
          console.log(`✗ Failed to parse line ${i + 1}: "${line}"`);
        }
      }
    }
  } else {
    console.log('No reconstructed lines found. Trying direct line-by-line parsing...');

    // Fallback: try parsing each line individually
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && line.match(/^\d{1,2}\s+\w{3}\s+\d{4}/)) {
        console.log(`Found potential transaction line: "${line}"`);
        const transaction = parseSBITransaction(line);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }
  }

  console.log(`\n=== PARSING SUMMARY ===`);
  console.log(`Total transactions parsed: ${transactions.length}`);

  if (transactions.length > 0) {
    console.log('First transaction:', transactions[0]);
    console.log('Last transaction:', transactions[transactions.length - 1]);
  }

  return transactions;
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
      return res.status(400).json({
        success: false,
        message: 'No transactions found in the PDF. The PDF text extraction might be incomplete or the format is not recognized.',
        debug: {
          textLength: extractedText.length,
          bankName,
          dateRange,
          accountInfo,
          textPreview: extractedText.substring(0, 1000)
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

const importTransactions = async (req, res) => {
  console.log('=== IMPORT TRANSACTIONS STARTED ===');
  try {
    const { transactions, bankInfo } = req.body;
    const userId = req.user.id;

    console.log('=== IMPORT TRANSACTIONS DEBUG ===');
    console.log('UserId:', userId);
    console.log('Transactions count:', transactions?.length);
    console.log('BankInfo:', bankInfo);

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction data'
      });
    }

    const savedTransactions = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      console.log(`\n--- Processing transaction ${i + 1} ---`);
      console.log('Original transaction:', txn);

      try {
        const transactionData = {
          userId: userId,
          amount: Math.abs(typeof txn.amount === 'number' ? txn.amount :
            (txn.debit ? parseFloat(txn.debit) : parseFloat(txn.credit || 0))),
          type: txn.type === 'debit' ? 'debit' : 'credit',
          category: txn.category || 'Personal', // Use extracted category
          description: txn.description || '',
          transactionDate: new Date(txn.txnDate || txn.date),
          valueDate: new Date(txn.valueDate || txn.txnDate || txn.date),
          source: 'bank_statement',
          bankName: bankInfo?.bankName || 'Unknown',
          refNo: txn.refNo || '',
          balance: txn.balance || 0,
          // New fields
          recipient: txn.recipient || null,
          recipientBank: txn.recipientBank || null
        };

        console.log('Processed transaction data:', transactionData);

        // Direct database save instead of using controller
        const savedTransaction = await Transaction.create(transactionData);

        console.log('Successfully saved transaction:', savedTransaction._id);
        savedTransactions.push(savedTransaction);

      } catch (error) {
        console.error('Error saving transaction:', error);
        errors.push({
          transaction: txn.description,
          error: error.message
        });
      }
    }

    console.log('\n=== IMPORT SUMMARY ===');
    console.log('Saved transactions:', savedTransactions.length);
    console.log('Errors:', errors.length);

    res.status(200).json({
      success: true,
      message: `${savedTransactions.length} transactions imported successfully`,
      data: {
        importedTransactions: savedTransactions,
        errors: errors,
        bankInfo: bankInfo,
        summary: {
          totalTransactions: savedTransactions.length,
          totalErrors: errors.length,
          totalDebits: savedTransactions.filter(t => t.type === 'debit').length,
          totalCredits: savedTransactions.filter(t => t.type === 'credit').length,
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
  validateProcessedData,
  reconstructTransactionLines,
  parseSBITransaction,
  parseTransactionDetails,
  parseTransactionData
};