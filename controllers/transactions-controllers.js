const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const User = require('../models/user');
const Transaction = require('../models/transaction');
const Pin = require('../models/authorizationKey');
const Bill = require('../models/bill');

const getAllTransactionsByUserId = async (req, res, next) => {
	const userId = req.params.uid;

	let transactions;
	try {
		transactions = await Transaction.find({
			$or: [{ creator: userId }, { receiver: userId }]
		});
	} catch (err) {}
	res.status(200).json({
		transactions: transactions.map((transaction) =>
			transaction.toObject({ getters: true })
		)
	});
};

const createTransaction = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(422).json({ message: 'Niepoprawna kwota przelewu' });
	}

	const { receiverAccountNumber, senderAccountNumber } = req.body;

	let sender, receiver;
	try {
		sender = await Account.findOne({ accountNumber: senderAccountNumber });
	} catch (err) {}

	try {
		receiver = await Account.findOne({ accountNumber: receiverAccountNumber });
	} catch (err) {
		return res.status(401).json({ message: 'Problem serwera' });
	}

	if (sender.money < req.body.money)
		return res
			.status(401)
			.json({ message: 'Nie masz wystarczających środków' });

	if (receiver) {
		if (sender.accountNumber === receiver.accountNumber) {
			return res
				.status(401)
				.json({ message: 'Nie można wykonać przelewu do samego siebie' });
		}
	}

	if (req.body.money <= 0) {
		return res.status(401).json({ message: 'Prosze podac wlasciowa kwote' });
	}

	// let pin = Math.floor(Math.random() * (9999 - 1000)) + 1000;
	let pin = 1111;

	const newPin = new Pin({
		pin: pin,
		user: sender._id
	});

	try {
		await newPin.save();
	} catch (err) {
		res.status(500).json({ message: 'Logowanie nieudane' });
	}

	return res.json({ pin });
};

const confirmTransactionWithPin = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ message: 'Niepoprawna kwota przelewu' });
	}

	const {
		title,
		receiverName,
		receiverAccountNumber,
		userId,
		senderAccountNumber
	} = req.body;

	let sender, receiver;
	try {
		sender = await Bill.findOne({ accountNumber: senderAccountNumber });
	} catch (err) {}

	try {
		receiver = await Bill.findOne({ accountNumber: receiverAccountNumber });
	} catch (err) {
		return res.status(401).json({ message: 'Problem serwera' });
	}

	let existingPin;
	try {
		existingPin = await Pin.findOne({ user: sender._id });
	} catch (err) {
		res.status(500).json({ message: 'Spróbuj ponownie' });
	}

	if (req.body.pin === existingPin.pin) {
		if (!receiver) {
			let finalSender;
			try {
				finalSender = await User.findById(sender.user);
			} catch (e) {
				return res
					.status(500)
					.json({ message: 'Transakcja nie została zapisana' });
			}

			senderName = `${finalSender.name} ${finalSender.surname}`;

			if (sender.money < req.body.money)
				return res
					.status(401)
					.json({ message: 'Nie masz wystarczających środków' });

			const newTransaction = new Transaction({
				title,
				money: req.body.money,
				senderName,
				receiverName,
				senderAccountNumber: sender.accountNumber,
				receiverAccountNumber,
				exists: false,
				creator: userId
			});

			try {
				const sess = await mongoose.startSession();
				sess.startTransaction();
				await newTransaction.save({ session: sess });
				finalSender.transactions.push(newTransaction);
				await finalSender.save({ session: sess });
				await sess.commitTransaction();
			} catch (err) {
				return res
					.status(500)
					.json({ message: 'Transakcja nie została zapisana' });
			}

			return res
				.status(200)
				.json({ message: 'Przelew został dodany do oczekujących' });
		}

		if (sender.money < req.body.money)
			return res
				.status(401)
				.json({ message: 'Nie masz wystarczających środków' });

		if (sender.accountNumber === receiver.accountNumber) {
			return res
				.status(401)
				.json({ message: 'Nie można wykonać przelewu do samego siebie' });
		}

		if (req.body.money <= 0) {
			return res.status(401).json({ message: 'Prosze podac wlasciowa kwote' });
		}

		try {
			await Account.findOneAndUpdate(
				{ accountNumber: sender.accountNumber },
				{ $inc: { money: -req.body.money } }
			);

			await Account.findOneAndUpdate(
				{ accountNumber: receiverAccountNumber },
				{ $inc: { money: req.body.money } }
			);
		} catch (err) {
			return res
				.status(401)
				.json({ message: 'Nie znaleziono uzytkownika o podanym numerze' });
		}

		let finalSender;
		try {
			finalSender = await User.findById(sender.user);
		} catch (e) {
			return res
				.status(500)
				.json({ message: 'Transakcja nie została zapisana' });
		}

		senderName = `${finalSender.name} ${finalSender.surname}`;

		let finalReceiver;
		try {
			finalReceiver = await User.findById(receiver.user);
		} catch (e) {
			return res
				.status(500)
				.json({ message: 'Transakcja nie została zapisana' });
		}

		const newTransaction = new Transaction({
			title,
			money: req.body.money,
			senderMoneyBeforeTransfer: sender.money,
			receiverMoneyBeforeTransfer: receiver.money,
			senderName,
			receiverName,
			senderAccountNumber: sender.accountNumber,
			receiverAccountNumber,
			creator: userId,
			receiver: finalReceiver._id
		});

		try {
			const sess = await mongoose.startSession();
			sess.startTransaction();
			await newTransaction.save({ session: sess });
			finalSender.transactions.push(newTransaction);
			await finalSender.save({ session: sess });
			finalReceiver.transactions.push(newTransaction);
			await finalReceiver.save({ session: sess });
			await sess.commitTransaction();
		} catch (err) {
			return res
				.status(500)
				.json({ message: 'Transakcja nie została zapisana' });
		}
		try {
			await Pin.deleteMany({ user: sender._id });
		} catch (e) {
			print(e);
		}

		res.status(200).json({ message: 'Przelew został wykonany' });
	} else {
		return res.status(500).json({ message: 'Niepoprawny pin' });
	}
};

exports.createTransaction = createTransaction;
exports.getAllTransactionsByUserId = getAllTransactionsByUserId;
exports.confirmTransactionWithPin = confirmTransactionWithPin;
