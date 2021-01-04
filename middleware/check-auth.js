const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	if (req.method === 'OPTIONS') {
		return next();
	}

	try {
		const token = req.headers.authorization.split(' ')[1];
		if (!token) {
			throw new Error('Authentication failed');
		}
		const decodedToken = jwt.verify(token, 'SECRET_KEY');
		req.userData = { userId: decodedToken.userId };
		next();
	} catch (err) {
		res.status(401).json({ message: 'Authentication failed' });
	}
};
