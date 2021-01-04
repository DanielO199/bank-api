const express = require('express');

const billsControllers = require('../controllers/bills-controllers');

const router = express.Router();
// Get all bills by user id
router.get('/all/:uid', [], billsControllers.getAllBillsByUserId);
//Create new bill and assing it to client
router.post('/', [], billsControllers.createNewBill);

module.exports = router;
