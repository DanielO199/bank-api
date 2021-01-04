const express = require('express');
const { check } = require('express-validator');

const transactionsControllers = require('../controllers/transactions-controllers');

const router = express.Router();
// Get all user transactions
router.get(
	'/user/:uid',
	[],
	transactionsControllers.getAllTransactionsByUserId
);

//Create transaction
router.post(
	'/',
	[check('money').isNumeric()],
	transactionsControllers.createTransaction
);
// Confirm transaction with authorizationKey
router.post('/confirm', [], transactionsControllers.confirmTransactionWithPin);

module.exports = router;
