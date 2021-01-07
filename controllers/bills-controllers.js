const mongoose = require('mongoose');

const User = require('../models/user');
const Bill = require('../models/bill');
const Transaction = require('../models/transaction');
const CONSTS = require('../utils/constants');
const _generateBillNumber = require('../utils/generate-billNumber');

const getAllBillsByUserId = async (req, res) => {
	const userId = req.params.uid;

	let bills;
	try {
		bills = await Bill.find({ user: userId });
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}
	return res.status(200).json({
		bills: bills.map((bill) => bill.toObject({ getters: true }))
	});
};

const getAllUserFunds = async (req, res) => {
	const userId = req.params.uid;

	let bills;
	try {
		bills = await Bill.find({ user: userId });
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	let funds = bills.reduce((acc, item) => acc + item.money, 0);

	return res.status(200).json({
		funds
	});
};

const getUserSavings = async (req, res) => {
	const userId = req.params.uid;

	let outgoingTransfers;
	try {
		outgoingTransfers = await Transaction.find({ sender: userId });
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	let incomingTransfers;
	try {
		incomingTransfers = await Transaction.find({ receiver: userId });
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	let moneyFromOutgoingTransfers = outgoingTransfers.reduce(
		(acc, item) => acc + item.money,
		0
	);
	let moneyFromIncomingTransfers = incomingTransfers.reduce(
		(acc, item) => acc + item.money,
		0
	);

	const savingsData = [
		{ name: 'outgoing', money: moneyFromOutgoingTransfers },
		{ name: 'incoming', money: moneyFromIncomingTransfers }
	];

	return res.status(200).json({
		savingsData
	});
};

const createNewBill = async (req, res) => {
	const { creatorId } = req.body;

	let user;
	try {
		user = await User.findById(creatorId);
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	const accountNumber = await _createBillNumber();

	const createdBill = new Bill({
		accountNumber,
		name: CONSTS.BILL_TYPE,
		money: 100,
		user: creatorId
	});

	try {
		await createdBill.save();
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		user.bills.push(createdBill);
		await user.save({ session: sess });
		await sess.commitTransaction();
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	return res.status(200).json({ message: 'Bill was created' });
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

exports.getAllBillsByUserId = getAllBillsByUserId;
exports.getAllUserFunds = getAllUserFunds;
exports.getUserSavings = getUserSavings;
exports.createNewBill = createNewBill;
