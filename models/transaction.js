const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const transactionSchema = new Schema({
	createdAt: { type: Date, default: Date.now },
	title: { type: String, required: true },
	money: { type: Number, required: true },
	//RELATIONS
	senderName: {
		type: String,
		required: true
	},
	receiverName: {
		type: String,
		required: true
	},
	senderAccountNumber: {
		type: String,
		required: true
	},
	receiverAccountNumber: {
		type: String,
		required: true
	},
	sender: {
		type: mongoose.Types.ObjectId,
		ref: 'User',
		required: true
	},
	receiver: {
		type: mongoose.Types.ObjectId,
		ref: 'User',
		required: false
	}
});

module.exports = mongoose.model('Transaction', transactionSchema);
