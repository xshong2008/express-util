var Utils = require('./utils');
var condition = function() {
	this.list = [];
};

Utils.apply(condition.prototype, {
	add: function(key, op, value) {
		this.list.push({
			key: key,
			op: op,
			value: value
		});
	},
	equal: function(key, value) {
		this.add(key, '=', value);
	},
	like: function(key, value) {
		value = Util.format('%{0}%', value);
		this.add(key, 'like', value);
	},
	leftLike: function(key, value) {
		value = Util.format('%{0}', value);
		this.add(key, 'like', value);
	},
	rightLike: function(key, value) {
		value = Util.format('{0}%', value);
		this.add(key, 'like', value);
	},
	in : function() {
		this.add(key, 'in', value);
	},
	between: function(key, value) {
		// this.add(key, 'between', [value[0], 'and', value[1]]);
	}
});