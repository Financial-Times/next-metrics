"use strict";

var Metrics = require('../lib/metrics');

module.exports = function(req, res, next) {
	Metrics.count('some.other.route', 2);
	next();
};
