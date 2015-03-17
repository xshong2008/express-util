var mysql = require('mysql'),
    dbConfig = require('../config/db-config');


module.exports.getConnection = function() {
    if ((module.exports.connection) && (module.exports.connection._socket) && (module.exports.connection._socket.readable) && (module.exports.connection._socket.writable)) {
        return module.exports.connection;
    }
    console.log(((module.exports.connection) ?
        "UNHEALTHY SQL CONNECTION; RE" : "") + "CONNECTING TO SQL.");
    /*var connection = mysql.createConnection({
        host: settings.host,
        port: settings.port,
        database: settings.db_name,
        user: settings.username,
        password: settings.password,
        //中文读取
        charset: "utf8"
    });*/
    var connection = mysql.createConnection(dbConfig);
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
    module.exports.connection = connection;
    return module.exports.connection;
};

// Open a connection automatically at app startup.
module.exports.getConnection();
// If you've saved this file as database.js, then get and use the
// connection as in the following example:
// var database = require(__dirname + "/database");
// var connection = database.getConnection();
// connection.query(query, function(err, results) { ....


module.exports.endConnection = function(conn, query) {
    conn.end((function(err) {
        if (err) {
            console.log('********Error Start**************');
            console.log('DateTime:', new Date());
            console.log('Sql:', this.sql);
            console.log('Error:', err);
            console.log('********Error End**************');
        }
    }).bind(query));
};
