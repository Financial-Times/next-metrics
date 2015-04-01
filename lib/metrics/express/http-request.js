"use strict";
var metrics = require('metrics');

var HttpRequest = module.exports = function HttpRequest() {
	this.counter = new metrics.Counter();
	this.reporter = this.reporter.bind(this);
};

HttpRequest.prototype.instrument = function(req) {
	if (!req._nextInstrumented) {
		this.counter.inc(1);
		req._nextInstrumented = true;
	}
};

HttpRequest.prototype.counts = function() {
	return {
		'express.http.req.count': this.counter.count
	};
};

HttpRequest.prototype.reset = function() {
	this.counter.clear();
};


HttpRequest.prototype.reporter = function() {
	var counts = this.counts();
	this.reset();
	return counts;
};
