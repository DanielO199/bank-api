const generateRandomNumber = require('./generate-number');
const CONSTS = require('../utils/constants');

const _generateBillNumber = () => {
	const checksum = generateRandomNumber(10, 99);
	const bankNumber = CONSTS.BANK_NUMBER;
	const customerAccountNumber = generateRandomNumber(1e15, 9e15);

	return `${checksum}${bankNumber}${customerAccountNumber}`;
};

module.exports = _generateBillNumber;
