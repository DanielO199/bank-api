const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const usersRoutes = require('./routes/user-routes');
const transactionsRoutes = require('./routes/transaction-routes');
const billsRoutes = require('./routes/bill-routes');

const server = express();

server.use(bodyParser.json());

server.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');

	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

	next();
});

server.use('/api/users', usersRoutes);
server.use('/api/transactions', transactionsRoutes);
server.use('/api/bills', billsRoutes);

server.use(() => {
	throw new Error('Wystąpił błąd');
});

mongoose
	.connect(
		'mongodb+srv://Bananq199:vvuaplPpz70ao31V@cluster0-fm9cw.mongodb.net/bank-db-develop?retryWrites=true&w=majority',
		{ useNewUrlParser: true, useUnifiedTopology: true }
	)
	.then(server.listen(process.env.PORT || 5000))
	.catch((err) => {
		console.log(err);
	});
