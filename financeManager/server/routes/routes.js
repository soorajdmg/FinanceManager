const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  updateNotifications,
  updatePrivacy
} = require('../controllers/authController');
const {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats
} = require('../controllers/txnController');
const {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  getBudgetStats
} = require('../controllers/budgetController');
const {
  uploadBankStatement,
  importTransactions,
  getUploadHistory
} = require('../controllers/uploadController');
const {
  getUserStats,
  getStatsSummary,
  refreshUserStats,
  getCategoryBreakdown,
  getMonthlyTrends,
  getMonthStats,
  updateUserGoals,
  getHealthScore,
  getCurrentMonthStats
} = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadBankStatement: uploadMiddleware, handleUploadError } = require('../middleware/uploadMiddleware');

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);

// Protected routes (authentication required)
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);

// User preference routes (all protected)
router.put('/notifications', authMiddleware, updateNotifications);
router.put('/privacy', authMiddleware, updatePrivacy);

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

// Stats routes (all protected)
// Total stats routes
router.get('/stats/:userId', authMiddleware, getUserStats);
router.get('/stats/:userId/summary', authMiddleware, getStatsSummary);
router.post('/stats/:userId/refresh', authMiddleware, refreshUserStats);
router.put('/stats/:userId/goals', authMiddleware, updateUserGoals);
router.get('/stats/:userId/health-score', authMiddleware, getHealthScore);

// Monthly stats routes
router.get('/stats/:userId/current-month', authMiddleware, getCurrentMonthStats);
router.get('/stats/:userId/month/:year/:month', authMiddleware, getMonthStats);
router.get('/stats/:userId/trends', authMiddleware, getMonthlyTrends);

// Category and analysis routes
router.get('/stats/:userId/categories', authMiddleware, getCategoryBreakdown);

// Upload routes (all protected)
router.post('/upload/bank-statement', authMiddleware, uploadMiddleware, handleUploadError, uploadBankStatement);
router.post('/upload/import-transactions', authMiddleware, importTransactions);
router.get('/upload/history', authMiddleware, getUploadHistory);

module.exports = router; 