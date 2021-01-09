const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const User = require('../models/user');
const Transaction = require('../models/transaction');
const AuthorizationKey = require('../models/authorizationKey');
const Bill = require('../models/bill');

const getAllTransactionsByUserId = async (req, res, next) => {
	const userId = req.params.uid;

	let transactions;
	try {
		transactions = await Transaction.find({
			$or: [{ sender: userId }, { receiver: userId }]
		});
	} catch (err) {}
	return res.status(200).json({
		transactions: transactions.map((transaction) =>
			transaction.toObject({ getters: true })
		)
	});
};

const createTransaction = async (req, res, next) => {
	const { receiverAccountNumber, senderAccountNumber } = req.body;

	let senderBill, receiverBill;
	try {
		senderBill = await Bill.findOne({ accountNumber: senderAccountNumber });
	} catch (err) {
		return res.status(401).json({ message: 'Server Failed' });
	}

	try {
		receiverBill = await Bill.findOne({ accountNumber: receiverAccountNumber });
	} catch (err) {
		return res.status(401).json({ message: 'Server Failed' });
	}

	if (senderBill.money < req.body.money)
		return res.status(401).json({ message: 'You do not have engough money' });

	if (!receiverBill)
		return res.status(401).json({ message: 'Receiver bill number not found' });

	if (senderBill.accountNumber === receiverBill.accountNumber)
		return res
			.status(401)
			.json({ message: 'Can not send money to this bill number' });

	if (req.body.money <= 0)
		return res.status(422).json({ message: 'Incorrect money amount' });

	// let pin = Math.floor(Math.random() * (9999 - 1000)) + 1000;
	let keyValue = `123adf`;

	const newKey = new AuthorizationKey({
		value: keyValue,
		bill: senderBill._id
	});

	try {
		await newKey.save();
	} catch (err) {
		res.status(500).json({ message: 'Server Failed' });
	}

	return res.json({
		newKey,
		message: 'Please check your email to receive authorization key'
	});
};

const confirmTransaction = async (req, res) => {
	const {
		title,
		receiverAccountNumber,
		senderAccountNumber,
		authorizationKey
	} = req.body;

	let senderBill, receiverBill;
	try {
		senderBill = await Bill.findOne({ accountNumber: senderAccountNumber });
		receiverBill = await Bill.findOne({ accountNumber: receiverAccountNumber });
	} catch (err) {
		return res.status(401).json({ message: 'Server Failed' });
	}

	let existingKey;
	try {
		existingKey = await AuthorizationKey.findOne({
			bill: senderBill._id
		});
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	if (authorizationKey !== existingKey.value)
		return res.status(422).json({ message: 'Invalid authorization key' });

	try {
		await Bill.findOneAndUpdate(
			{ accountNumber: senderBill.accountNumber },
			{ $inc: { money: -req.body.money } }
		);

		await Bill.findOneAndUpdate(
			{ accountNumber: receiverAccountNumber },
			{ $inc: { money: req.body.money } }
		);
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	let sender, receiver;
	try {
		sender = await User.findById(senderBill.user);
		receiver = await User.findById(receiverBill.user);
	} catch (e) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	const senderName = `${sender.firstName} ${sender.lastName}`;
	const receiverName = `${receiver.firstName} ${receiver.lastName}`;

	const newTransaction = new Transaction({
		title,
		money: req.body.money,
		senderName,
		receiverName,
		senderAccountNumber: senderBill.accountNumber,
		receiverAccountNumber,
		sender: sender._id,
		receiver: receiver._id
	});

	try {
		await newTransaction.save();
	} catch (error) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();

		sender.transactions.push(newTransaction);
		await sender.save({ session: sess });
		receiver.transactions.push(newTransaction);
		await receiver.save({ session: sess });
		await sess.commitTransaction();
	} catch (err) {
		return res.status(500).json({ message: 'Transakcja nie została zapisana' });
	}
	try {
		await AuthorizationKey.deleteMany({ bill: senderBill._id });
	} catch (e) {
		print(e);
	}
	res.status(200).json({ message: 'Transaction has been created' });
};

exports.createTransaction = createTransaction;
exports.getAllTransactionsByUserId = getAllTransactionsByUserId;
exports.confirmTransaction = confirmTransaction;
