'use strict';

function getExtension (path) {
	return req.path.split('.').pop() || 'null';
}

function Router () {
	this.routes = {};
}

Router.prototype.defineRoute = function (pattern, conf) {
	this.routes[conf.name || pattern] = conf;
}

Router.prototype.allocateToRoute = function (req, res, routeName) {
	var conf = this.routes[routeName];

	var extendedRouteName = conf.splitOn ? this.extendRouteName(routeName, conf.splitOn, req) : routeName;

	req._nextMetricsRoute = res._nextMetricsRoute = extendedRouteName.replace(/[\/\\\.]/g, '_');

};

Router.prototype.extendRouteName = function (routeName, splitters, req) {
	splitter.forEach(function (splitter) {
		// split the route by file extension
		if (splitter === 'extension') {
			routeName += '_' + getExtension(req.path);

		// split on the eistence or value of a query string
		} else if (splitter.indexOf('queryString') === 0) {
			var qsDetails = splitter.split(':');
			if (qsDetails.length === 3) {
				routeName += '_' + (req.query[qsDetails[1]] === qsDetails[2] ? '' : 'no-') + qsDetails[1] + '-' + qsDetails[2];
			} else {
				routeName += '_' + (req.query[qsDetails[1]] ? '' : 'no-') + qsDetails[1];
			}

		// split on the eistence or value of a header
		} else if (splitter.indexOf('header') === 0) {
			var headerDetails = splitter.split(':');
			if (headerDetails.length === 3) {
				routeName += '_' + (req.get(headerDetails[1]) === headerDetails[2] ? '' : 'no-') + headerDetails[1] + '-' + headerDetails[2];
			} else {
				routeName += '_' + (req.get(headerDetails[1]) ? '' : 'no-') + headerDetails[1];
			}

	})

	return routeName;
};

module.exports = new Router();
