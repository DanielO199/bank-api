const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const billSchema = new Schema({
	accountNumber: { type: String, required: true },
	name: { type: String, required: true },
	money: { type: Number, required: true },
	//REALTIONS
	user: { type: mongoose.Types.ObjectId, ref: 'User', required: false }
});

module.exports = mongoose.model('Bill', billSchema);
