const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');

const router = express.Router();
//GET USER BY ID
router.get('/:uid', usersControllers.getUserDataById);
//Login USER
router.post('/login', [], usersControllers.loginUser);
//Register USER
router.post(
	'/register',
	[
		check('firstName').not().isEmpty(),
		check('lastName').not().isEmpty(),
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 6 })
	],
	usersControllers.createUser
);
//update user data
router.patch(
	'/:uid',
	[
		check('firstName').not().isEmpty(),
		check('lastName').not().isEmpty(),
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 6 })
	],
	usersControllers.updateUserData
);

module.exports = router;
