const express = require('express');

const accountsControllers = require('../controllers/bills-controllers');

const router = express.Router();
// Get all bills by user id
router.get('/all/:uid', [], accountsControllers.getAllBillsByUserId);
//Create new bill and assing it to client
router.post('/', [], accountsControllers.createNewBill);

module.exports = router;
