var Util = require('./utils'),
	nodeUtil = require('util');


var helper = {
	getReqMode: function(req, mode) {
		var data = {};
		if (nodeUtil.isArray(mode)) {
			mode.forEach(function(key) {
				data[key] = req.param(key) || '';
			});
		} else {
			for (var key in mode) {
				var name = mode[key] || key;
				data[key] = req.param(name) || '';
			}
		}

		return data;
	},
	getReqCondition: function(req) {
		var condition = req.param('condition') || '{}';
		condition = eval('(' + condition + ')');

		return condition;
	},
	getReqId: function(req, res) {
		return req.param('id');
	},
	getList: function(req, res, dao) {
		try {
			var config = this.getReqMode(req, ['orderField', 'orderDir', 'pageSize', 'pageIndex']);
			config.condition = req.condition; //这两项数据需要自行组织
			if (config.orderField) {
				config.orderby = {};
				config.orderby[config.orderField] = config.orderDir || 'asc';
			}

			dao.getPageList(config, function(err, rows, total) {
				if (err) {
					res.send(helper.resFail({
						total: 0,
						rows: []
					}, 'getlist fail'));
				} else {
					res.send(helper.resSucc({
						total: total,
						rows: rows
					}));
				}
			});
		} catch (e) {
			res.send(helper.resFail({
				total: 0,
				rows: []
			}, 'getlist fail'));
			console.log(e);
		}
	},
	getMode: function(req, res, dao) {
		var id = this.getReqId(req);
		dao.getMode(id, function(err, mode) {
			if (err) {
				res.send(helper.resFail({}, 'mode get fail'));
			} else {
				res.send(helper.resSucc(mode));
			}
		});
	},
	save: function(req, res, dao) {
		var mode = req.mode;

		dao.save(mode, function(err, ret) {
			if (err) {
				res.send(helper.resFail(false, 'save fail'));
			} else {
				res.send(helper.resSucc(true, ''));
			}
		});
	},
	del: function(req, res, dao) {
		dao.del(req.param('ids'), function(err, ret) {
			if (err) {
				res.send(helper.resFail(false, 'del fail'));
			} else {
				res.send(helper.resSucc(true));
			}
		});
	},
	resJson: function(succ, data, msg) {
		return {
			success: succ,
			msg: msg || '',
			data: data || null
		};
	},
	resFail: function(data, msg) {
		return helper.resJson(false, data, msg);
	},
	resSucc: function(data, msg) {
		return helper.resJson(true, data, msg);
	},
	resPage: function(req, res, page) {
		var pm = res.pageMode || {};
		pm = Util.apply(pm, {
			Util: Util,
			userId: req.session.userId,
			errorMsg: res.errorMsg,
			successMsg: res.successMsg
		});
		res.render(page, pm);
	}
};

module.exports = helper;