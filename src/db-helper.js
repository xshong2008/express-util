var mysql = require('mysql'),
	dbConfig = require('../config/db-config');

module.exports = mysql.createConnection(dbConfig);