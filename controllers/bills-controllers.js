const mongoose = require('mongoose');

const User = require('../models/user');
const Account = require('../models/account');

const getAllBillsByUserId = async (req, res) => {
	const userId = req.params.uid;
	let accounts;
	try {
		accounts = await Account.find({ user: userId });
	} catch (err) {
		res
			.status(500)
			.json({ message: 'Wystąpił błąd, spróbuj ponownie później' });
	}
	res.status(200).json({
		accounts: accounts.map((account) => account.toObject({ getters: true }))
	});
};

const createNewBill = async (req, res) => {
	const { creatorId, name } = req.body;

	let user;
	try {
		user = await User.findById(creatorId);
	} catch (err) {
		return res
			.status(500)
			.json({ message: 'Wystąpił błąd, spróbuj ponownie później' });
	}
	let accountNumber = 999999999999 - user.person_id;

	let randomNumbers = Math.floor(Math.random() * (9999999999 - 100)) + 100;

	let finalAccountNumber = `0000${accountNumber}${randomNumbers}`;

	const createdAccount = new Account({
		accountNumber: finalAccountNumber,
		name,
		money: 1000,
		user: creatorId
	});

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await createdAccount.save({ session: sess });
		user.accounts.push(createdAccount);
		await user.save({ session: sess });
		await sess.commitTransaction();
	} catch (err) {
		console.log(err);
		return res.status(500).json({ message: 'Rachunek nie został założony' });
	}

	return res.status(200).json({ message: 'Rachunek został założony' });
};

exports.getAllBillsByUserId = getAllBillsByUserId;
exports.createNewBill = createNewBill;
