const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Bill = require('../models/bill');
const User = require('../models/user');
const CONSTS = require('../utils/constants');
const hashPassword = require('../utils/hash-password');
const generateRandomNumber = require('../utils/generate-number');
const _generateBillNumber = require('../utils/generate-billNumber');

const getUserDataById = async (req, res, next) => {
	const userId = req.params.uid;

	let user;
	try {
		user = await User.findById(userId, { password: 0 });
	} catch (err) {
		res.status(500).json({ message: 'Server Error' });
	}

	res.json({ user });
};

const createUser = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ message: 'Please check your data' });
	}

	const { firstName, lastName, email } = req.body;

	let existingUser;
	try {
		existingUser = await User.findOne({ email: email });
	} catch (err) {
		res.status(500).json({ message: 'Signin up failed' });
	}

	if (existingUser) {
		return res.status(422).json({ message: 'Email is already used' });
	}

	const pinCode = await _createPinCode();

	const password = await hashPassword(req.body.password);

	const accountNumber = await _createBillNumber();

	const createdUser = new User({
		firstName,
		lastName,
		email,
		role: CONSTS.USER_ROLE,
		pinCode,
		password,
		bills: [],
		transactions: []
	});

	const createdBill = new Bill({
		accountNumber,
		name: CONSTS.BILL_TYPE,
		money: 100,
		user: createdUser.id
	});

	try {
		await createdUser.save();
		await createdBill.save();
	} catch (err) {
		return res.status(500).json({ message: 'Signing up failed' });
	}

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		createdUser.bills.push(createdBill);
		await createdUser.save({ session: sess });
		await sess.commitTransaction();
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	return res.status(201).json({ pinCode: createdUser.pinCode });
};

const _createBillNumber = async () => {
	const accountNumber = _generateBillNumber(1, 10e5 - 1);
	const data = await Bill.find({ accountNumber: accountNumber });

	try {
		return data.length === 0 ? accountNumber : _generateBillNumber();
	} catch (error) {
		throw new Error(error);
	}
};

const _createPinCode = async () => {
	const pinCode = generateRandomNumber(1, 10e5 - 1);
	const data = await User.find({ pinCode: pinCode });

	try {
		return data.length === 0 ? pinCode : _createPinCode();
	} catch (error) {
		throw new Error(error);
	}
};

const loginUser = async (req, res, next) => {
	const { pinCode, password } = req.body;

	let existingUser;
	try {
		existingUser = await User.findOne({ pinCode });
	} catch (err) {
		res.status(500).json({ message: 'Login failed' });
	}

	if (!existingUser) {
		res.status(422).json({ message: 'Please check your data' });
	}

	let isValidPassword = await bcrypt.compare(password, existingUser.password);

	if (!isValidPassword) {
		res.status(401).json({ message: 'Please check your data' });
	}

	let token = jwt.sign(
		{ userId: existingUser.id, email: existingUser.email },
		'SECRET_KEY',
		{ expiresIn: '1h' }
	);

	return res.json({
		adminId: existingUser.id,
		email: existingUser.email,
		token
	});
};

const updateUserData = async (req, res, next) => {
	const userId = req.params.uid;
	const { firstName, lastName, email, password } = req.body;

	let updatedUser;
	try {
		updatedUser = await User.findById(userId);
	} catch (err) {
		res.status(500).json({ message: 'Server Error' });
	}

	updatedUser.firstName = firstName;
	updatedUser.lastName = lastName;
	updatedUser.email = email;
	updatedUser.password = await hashPassword(password);

	try {
		await updatedUser.save();
	} catch (err) {
		res.status(500).json({ message: 'Server Error' });
	}

	return res.status(201).json({
		message: 'Data has been updated'
	});
};

exports.getUserDataById = getUserDataById;
exports.loginUser = loginUser;
exports.createUser = createUser;
exports.updateUserData = updateUserData;
