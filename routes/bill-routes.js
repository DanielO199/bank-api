const express = require('express');

const billsControllers = require('../controllers/bills-controllers');

const router = express.Router();
// Get all bills
router.get('/all', billsControllers.getAllBills);
// Get all bills by user id
router.get('/:uid', billsControllers.getAllBillsByUserId);
// Get all user funds
router.get('/funds/:uid', billsControllers.getAllUserFunds);
// Get user savings
router.get('/savings/:uid', billsControllers.getUserSavings);
//Create new bill and assing it to client
router.post('/', billsControllers.createNewBill);

module.exports = router;
