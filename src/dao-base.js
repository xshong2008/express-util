var Util = require('./utils'),
	dbHelper = require('./db-helper'),
	nodeUtil = require('util'),
	nodeUUID = require('node-uuid'),
	SQL = {
		SELECT: 'select * from {0}',
		SELECT_IN: 'select * from {0} where id in (?)',
		INSERT: 'insert into ?? set ?',
		DELETE: 'delete from ? where id=?',
		DELETE_IN: 'delete from {0} where id in (?)',
		UPDATE: 'update ?? set ? where id=?',
		GETMODE: 'select * from ?? where id=?',
		COUNT: 'select count(id) as total from {0}'
	};


var DAO = function(config) {
	Util.apply(this, config);
};

var daoPrototype = {
	dbHelper: dbHelper,
	newUUID: function() {
		return nodeUUID.v1();
	},
	doTransaction: function(sqlList, callback) {
		dbHelper.beginTransaction(function(err) {
			if (err) {
				throw err;
			}
			var index = 0,
				len = sqlList.length,
				runSql = function() {
					var item = sqlList[index],
						sql = '',
						data = [];
					if (typeof(item) == 'object') {
						data = item.data;
						sql = item.sql;
					} else {
						sql = item;
					}
					dbHelper.query(sql, data, function(err, ret) {
						index++;
						if (err) {
							dbHelper.rollback(function() {
								throw err;
							});
						}
						if (index == len) {
							dbHelper.commit(function(err) {
								if (err) {
									dbHelper.rollback(function() {
										throw err;
									});
								} else {
									callback();
								}
							});
						} else {
							runSql();
						}
					});
				};

			runSql();
		});
	},
	getConditionStr: function(condition) {
		if (!condition) {
			return '';
		}
		if (typeof condition == 'string') {
			return condition;
		}
		condition = [].concat(condition);

		var str = [];
		condition.forEach(function(item, index) {
			var tpl = '';
			switch (item.op) {
				case 'in':
					tpl = "{0} {1} ('{2}') {3}";
					break;
				default:
					tpl = "{0} {1} '{2}' {3}";
					break;
			}
			str.push(Util.format(tpl, item.key, item.op, item.value, item.condition || 'and'));
		});
		str.push('1=1');

		return 'where ' + str.join(' ');
	},
	getOrderByStr: function(orderby) {
		if (!orderby) {
			return '';
		}
		var str = [];
		for (var field in orderby) {
			var dir = orderby[field];

			str.push([field, dir].join(' '));
		}
		if (str.length) {
			str = 'order by ' + str.join(',');
		}
		return str;
	},
	getList: function(condition, orderby, callback) {
		if (typeof condition == 'function') {
			callback = condition;
			condition = null;
			order = null;
		} else if (typeof(orderby) == 'function') {
			callback = orderby;
			orderby = null;
		}

		var sql = [Util.format(SQL.SELECT, this.tableName)];
		sql.push(this.getConditionStr(condition)),
		sql.push(this.getOrderByStr(orderby));

		var query = dbHelper.query(sql.join(' '), callback);
		console.log(query.sql);
	},
	/**
	*@param config
	{
		condition:[],
		orderby:[],
		pagesize:20,
		pageindex:1
	}
	*/
	getPageList: function(config, callback) {
		config = config || {};
		if (typeof(config) == 'function') {
			callback = config;
			config = {};
		}
		var conditionStr = this.getConditionStr(config.condition),
			orderbyStr = this.getOrderByStr(config.orderby),
			countSql = Util.format(SQL.COUNT, this.viewName || this.tableName),
			selectSql = Util.format(SQL.SELECT, this.viewName || this.tableName),
			pageStr = '';

		if (config.pageSize) {
			config.pageIndex = config.pageIndex || 0;
			var start = config.pageSize * config.pageIndex,
				end = (config.pageIndex + 1) * config.pageSize;

			pageStr = ['LIMIT', ' ', start, ',', end].join('');
		}

		var sqlList = [];
		selectSql = [selectSql, conditionStr, orderbyStr, pageStr].join(' ');
		countSql = [countSql, conditionStr, orderbyStr].join(' ');
		selectSql = Util.trim(selectSql);
		countSql = Util.trim(countSql);

		sqlList.push(selectSql);
		sqlList.push(countSql);

		dbHelper.query(sqlList.join('; '), function(err, rets) {
			if (err || rets.length != 2) {
				callback(err, null);
			} else {
				callback(err, rets[0], rets[1][0].total);
			}
		});
		console.log(sqlList);
	},
	save: function(mode, callback) {
		if (mode.id) {
			this.edit(mode, callback);
		} else {
			this.add(mode, callback);
		}
	},
	add: function(mode, callback) {
		mode.id = nodeUUID.v1();

		var query = dbHelper.query(SQL.INSERT, [this.tableName, mode], function(err, ret) {
			if (callback) {
				if (err) {
					callback(err, false);
					console.log(err);
				} else {
					callback(err, true);
				}
			}
		});

		console.log(query.sql);
	},
	edit: function(mode, callback) {
		var query = dbHelper.query(SQL.UPDATE, [this.tableName, mode, mode.id], function(err, ret) {
			if (callback) {
				if (err) {
					callback(err, false);
					console.log(err);
				} else {
					callback(err, true);
				}
			}
		});

		console.log(query.sql);
	},
	getMode: function(id, callback) {
		var query = dbHelper.query(SQL.GETMODE, [this.viewName || this.tableName, id], function(err, ret) {
			if (callback) {
				var mode = undefined;
				if (!err && ret.length) {
					mode = ret[0];
				}
				callback(err, mode);
			}
		});
		console.log(query.sql);
	},
	del: function(ids, callback) {
		var sql = Util.format(SQL.DELETE_IN, this.tableName);
		var query = dbHelper.query(sql, [ids.split(',')], function(err, ret) {
			if (callback) {
				if (err) {
					callback(err, false);
					console.log(err);
				} else {
					callback(err, true);
				}
			}
		});
		console.log(query.sql);
	},
	getListIn: function(ids, callback) {
		var sql = Util.format(SQL.SELECT_IN, this.tableName);
		if (!nodeUtil.isArray(ids)) {
			ids = ids.split(',');
		}
		var query = dbHelper.query(sql, [ids], function(err, ret) {
			if (callback) {
				if (err) {
					callback(err);
				} else {
					callback(err, ret);
				}
			}
		});
		console.log(query.sql);
	}
}

Util.override(DAO, daoPrototype);

var extend = function(superclass, exconfig) {
	var fn = function(config) {
		Util.apply(this, config);
	};
	var sp = superclass.prototype;
	fn.prototype = Util.apply({}, sp, exconfig);
	fn.superclass = sp;

	var _ins = null;
	fn.getInstance = function() {
		if (!_ins) {
			_ins = new fn();
		}
		return _ins;
	};
	fn.extend = function(exconfig) {
		return extend(fn, exconfig);
	};
	return fn;
};

DAO.extend = function(exconfig) {
	return extend(DAO, exconfig);
};

module.exports = DAO;