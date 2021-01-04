const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const authorizationKey = new Schema({
	createdAt: { type: Date, default: Date.now },
	value: { type: String, required: true },
	bill: { type: mongoose.Types.ObjectId, ref: 'Bill', required: true }
});

authorizationKey.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model('AuthorizationKey', authorizationKey);
