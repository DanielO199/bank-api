const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');

const router = express.Router();

//GET USER BY ID
router.get('/:uid', [], usersControllers.getUserDataById);
//LOGIN USER
router.post('/login', [], usersControllers.loginUser);
//update user data
router.patch('/:uid', [], usersControllers.updateUserData);

module.exports = router;
