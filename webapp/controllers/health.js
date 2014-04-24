// __health code
'use strict';
var healthStatus = {
	status: 'OK'
};

module.exports = function (req, res) {
	res.jsonp(healthStatus);
};