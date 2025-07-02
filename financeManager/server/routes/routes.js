const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats
} = require('../controllers/transactionController');
const {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  getBudgetStats
} = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);

// Protected routes (authentication required)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);

// Transaction routes (all protected)
router.post('/transactions', authMiddleware, createTransaction);
router.get('/transactions', authMiddleware, getTransactions);
router.get('/transactions/stats', authMiddleware, getTransactionStats);
router.get('/transactions/:id', authMiddleware, getTransaction);
router.put('/transactions/:id', authMiddleware, updateTransaction);
router.delete('/transactions/:id', authMiddleware, deleteTransaction);

// Budget routes (all protected)
router.post('/budgets', authMiddleware, createBudget);
router.get('/budgets', authMiddleware, getBudgets);
router.get('/budgets/stats', authMiddleware, getBudgetStats);
router.get('/budgets/:id', authMiddleware, getBudget);
router.put('/budgets/:id', authMiddleware, updateBudget);
router.delete('/budgets/:id', authMiddleware, deleteBudget);

module.exports = router;