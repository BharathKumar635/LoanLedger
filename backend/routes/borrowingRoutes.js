const express = require('express');
const router = express.Router();
const borrowingController = require('../controllers/borrowingController');

// Search records by surname, name, or phone number
router.get('/search', borrowingController.searchBorrowings);

// Get single record by ID with real-time interest
router.get('/:id', borrowingController.getBorrowingById);

// Get interest calculation details
router.get('/:id/interest', borrowingController.getBorrowingInterest);

// Create new borrowing record (MongoDB Atlas persistence)
router.post('/', borrowingController.createBorrowing);

// Monthly interest update trigger
router.post('/monthly-update', borrowingController.triggerMonthlyUpdate);

module.exports = router;

