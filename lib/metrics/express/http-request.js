"use strict";
var metrics = require('metrics');

var HttpRequest = module.exports = function HttpRequest(routes) {

	this.counters = {
		'default': new metrics.Counter()
	};

	if (routes) {
		this.routes = routes;
		Object.keys(routes).forEach(function (routeName) {
			this.counters[routeName] = new metrics.Counter();
		}.bind(this));
	}
	this.reporter = this.reporter.bind(this);
};

HttpRequest.prototype.instrument = function(req) {
	if (!req._nextInstrumented) {
		req._nextInstrumented = true;

		if (this.routes) {
			if (Object.keys(routes).some(function (routeName) {
				if (routes[routeName].test(req.path)) {
					this.counters[routeName].inc(1);
					return true;
				}
			}) {
				return;
			}
		}

		this.counters['default'].inc(1);

	}
};

HttpRequest.prototype.counts = function() {
	return Object.keys(this.counters).reduce(function (obj, key) {
		obj['express.http.req.count.' + key] = this.counters[key].count;
	}, {});
};

HttpRequest.prototype.reset = function() {
	Object.keys(this.counters).forEach(function (key) {
		this.counters[key].clear();
	}.bind(this));

};


HttpRequest.prototype.reporter = function() {
	var counts = this.counts();
	this.reset();
	return counts;
};
