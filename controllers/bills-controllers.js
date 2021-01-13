const mongoose = require('mongoose');

const User = require('../models/user');
const Bill = require('../models/bill');
const Transaction = require('../models/transaction');
const CONSTS = require('../utils/constants');

const _generateBillNumber = require('../utils/generate-billNumber');

const getAllBills = async (req, res) => {
	let bills;
	try {
		bills = await Bill.find();
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}
	return res.status(200).json({
		bills: bills.map((bill) => bill.toObject({ getters: true }))
	});
};

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

	let user;
	try {
		user = await User.find({ user: userId });
	} catch (err) {
		return res.status(500).json({ message: 'Server Failed' });
	}

	let funds = bills.reduce((acc, item) => acc + item.money, 0);

	const fundsData = [
		{ date: user.createdAt, money: 100 },
		{ date: new Date(), money: funds }
	];

	return res.status(200).json({
		fundsData,
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

	let sum = moneyFromOutgoingTransfers + moneyFromIncomingTransfers;
	let percentage = (moneyFromIncomingTransfers / sum) * 100;

	const savingsData = [
		{ name: 'outgoing', money: moneyFromOutgoingTransfers },
		{ name: 'incoming', money: moneyFromIncomingTransfers }
	];

	return res.status(200).json({
		savingsData,
		percentage
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

	if (!user) return res.status(404).json({ message: 'User does not exist' });

	const accountNumber = await _createBillNumber();

	const createdBill = new Bill({
		accountNumber,
		name: CONSTS.BILL_TYPE,
		money: 0,
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

	return res.json({ message: 'Bill was created', bill: createdBill });
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

exports.getAllBills = getAllBills;
exports.getAllBillsByUserId = getAllBillsByUserId;
exports.getAllUserFunds = getAllUserFunds;
exports.getUserSavings = getUserSavings;
exports.createNewBill = createNewBill;
