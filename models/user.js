const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true },
	role: { type: Number, required: true },
	pinCode: { type: String, required: true },
	password: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
	transactions: [
		{ type: mongoose.Types.ObjectId, required: true, ref: 'Transaction' }
	],
	bills: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Bill' }]
});

module.exports = mongoose.model('User', userSchema);
