// __metrics code
'use strict';
var metrics = {
	schemaVersion: 1,
	metrics: {}
};

module.exports = function (req, res) {
	res.jsonp(metrics);
};