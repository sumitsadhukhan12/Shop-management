import { Router } from 'express';
import { requireAuth, requireAdmin, loginRateLimiter } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as productController from '../controllers/productController';
import * as categoryController from '../controllers/categoryController';
import * as priceHistoryController from '../controllers/priceHistoryController';
import * as billController from '../controllers/billController';
import * as paymentController from '../controllers/paymentController';
import * as customerController from '../controllers/customerController';
import * as settingsController from '../controllers/settingsController';
import * as excelController from '../controllers/excelController';
import * as auditController from '../controllers/auditController';

export const apiRouter = Router();

// --- Auth Routes ---
apiRouter.post('/auth/login', loginRateLimiter, authController.login);
apiRouter.get('/auth/me', requireAuth, authController.getCurrentUser);
apiRouter.post('/auth/reset-password-verify', authController.resetPasswordWithVerification);
apiRouter.post('/auth/admin-reset-password', requireAdmin, authController.adminResetStaffPassword);

// --- User & Staff Management (Admin Only) ---
apiRouter.get('/users/staff', requireAdmin, authController.listStaff);
apiRouter.post('/users/staff', requireAdmin, authController.createStaff);
apiRouter.put('/users/staff/:id', requireAdmin, authController.updateStaff);
apiRouter.delete('/users/staff/:id', requireAdmin, authController.deleteStaff);

// --- Product Routes ---
apiRouter.get('/products', requireAuth, productController.listProducts);
apiRouter.get('/products/quick-search', requireAuth, productController.quickSearch);
apiRouter.get('/products/:id', requireAuth, productController.getProductById);
apiRouter.post('/products', requireAdmin, productController.createProduct);
apiRouter.put('/products/:id', requireAdmin, productController.updateProduct);
apiRouter.put('/products/:id/stock-status', requireAdmin, productController.updateStockStatus);
apiRouter.delete('/products/:id', requireAdmin, productController.deleteProduct);

// --- Category Routes ---
apiRouter.get('/categories', requireAuth, categoryController.listCategories);
apiRouter.post('/categories', requireAdmin, categoryController.createCategory);
apiRouter.put('/categories/:id', requireAdmin, categoryController.updateCategory);
apiRouter.delete('/categories/:id', requireAdmin, categoryController.deleteCategory);

// --- Price History Routes (Admin Only) ---
apiRouter.get('/price-history', requireAdmin, priceHistoryController.listPriceHistory);

// --- Billing Routes ---
apiRouter.get('/bills', requireAuth, billController.listBills);
apiRouter.get('/bills/:id', requireAuth, billController.getBillById);
apiRouter.post('/bills', requireAuth, billController.createBill);
apiRouter.post('/bills/:id/cancel', requireAdmin, billController.cancelBill);

// --- Due Records & Payments Routes ---
apiRouter.get('/payments/dues', requireAuth, paymentController.listDueRecords);
apiRouter.get('/payments', requireAuth, paymentController.listPayments);
apiRouter.post('/payments', requireAuth, paymentController.recordDuePayment);

// --- Customers Routes ---
apiRouter.get('/customers', requireAuth, customerController.listCustomers);
apiRouter.get('/customers/:id', requireAuth, customerController.getCustomerDetails);

// --- Settings Routes ---
apiRouter.get('/settings', requireAuth, settingsController.getSettings);
apiRouter.put('/settings', requireAdmin, settingsController.updateSettings);

// --- Excel Import/Export Routes (Admin Only) ---
apiRouter.get('/excel/export', requireAdmin, excelController.exportExcel);
apiRouter.get('/excel/template', requireAdmin, excelController.downloadTemplate);
apiRouter.post('/excel/import', requireAdmin, excelController.validateAndImportExcel);

// --- Audit Log Routes (Admin Only) ---
apiRouter.get('/audit', requireAdmin, auditController.listAuditLogs);
