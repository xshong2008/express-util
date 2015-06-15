var mysql = require('mysql'),
    dbConfig = require('../config/db-config'),
    connection = null;


module.exports.getConnection = function(config) {
    if ((connection) && (connection._socket) && (connection._socket.readable) && (connection._socket.writable)) {
        return connection;
    }

    connection = mysql.createConnection(config);
    connection.connect(function(err) {
        if (err) {
            console.log("SQL CONNECT ERROR: " + err);
        } else {
            console.log("SQL CONNECT SUCCESSFUL.");
        }
    });
    connection.on("close", function(err) {
        console.log("SQL CONNECTION CLOSED.");
    });
    connection.on("error", function(err) {
        console.log("SQL CONNECTION ERROR: " + err);
    });

    return connection;
};

// Open a connection automatically at app startup.
module.exports.getConnection(dbConfig);
// If you've saved this file as database.js, then get and use the
// connection as in the following example:
// var database = require(__dirname + "/database");
// var connection = database.getConnection();
// connection.query(query, function(err, results) { ....


module.exports.endConnection = function(conn, query) {
    return;
};
