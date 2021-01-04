const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Nexmo = require('nexmo');

const User = require('../models/user');
const AuthorizationKey = require('../models/authorizationKey');
const UserActionHistory = require('../models/user-action-history');

const getUserDataById = async (req, res, next) => {
	const userId = req.params.uid;

	let user;
	try {
		user = await User.findById(userId);
	} catch (err) {
		res.status(500).json({ message: 'Nie można wczytać danych' });
	}

	res.json({ user });
};

const loginUser = async (req, res, next) => {
	const { login, password } = req.body;

	let existingUser;
	try {
		existingUser = await User.findOne({ login });
	} catch (err) {
		res.status(500).json({ message: 'Logowanie nieudane' });
	}

	if (!existingUser) {
		res.status(401).json({ message: 'Niepoprawne dane' });
	}

	if (existingUser.status === 'inactive') {
		res.status(401).json({ message: 'Twoje konto jest nieaktywne' });
	}

	let isValidPassword = await bcrypt.compare(password, existingUser.password);

	if (!isValidPassword) {
		res.status(401).json({ message: 'Niepoprawne dane' });
	}

	if (existingUser && isValidPassword) {
		// let pin = Math.floor(Math.random() * (9999 - 1000)) + 1000;
		let pin = 1111;

		const newPin = new Pin({
			pin: pin,
			user: existingUser._id,
			attempt: 0
		});

		try {
			await newPin.save();
		} catch (err) {
			res.status(500).json({ message: 'Logowanie nieudane' });
		}

		// const nexmo = new Nexmo({
		// 	apiKey: 'd2356039',
		// 	apiSecret: 'yKcNHdTHNXUmZx44'
		// });

		// const from = 'Vonage APIs';
		// const to = '48534377118';
		// const text = `${pin} - uwaga ważność pinu to 2 minuty, po upływie czasu należy zalogować się od nowa`;
		// nexmo.message.sendSms(from, to, text);
		console.log(newPin.pin);
	}

	res.json({
		pin: pin
	});
};

const updateUserData = async (req, res, next) => {
	const userId = req.params.uid;
	const { name, surname, address, email, phone } = req.body;

	let updatedUser;
	try {
		updatedUser = await User.findById(userId);
	} catch (err) {
		res.status(500).json({ message: 'Spróbuj ponownie' });
	}

	updatedUser.name = name;
	updatedUser.surname = surname;
	updatedUser.address = address;
	updatedUser.email = email;
	updatedUser.phone = phone;

	try {
		await updatedUser.save();
	} catch (err) {
		res.status(500).json({ message: 'Spróbuj ponownie' });
	}

	const userActionHistoryLog = new UserActionHistory({
		user: updatedUser,
		action: 'Aktualizacja danych'
	});

	try {
		await userActionHistoryLog.save();
	} catch (error) {}

	return res.status(200).json({
		message: 'Dane został zaktualizowane'
	});
};

exports.getUserDataById = getUserDataById;
exports.loginUser = loginUser;
exports.updateUserData = updateUserData;
