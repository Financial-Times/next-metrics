"use strict";
var metrics = require('metrics');
var isRealUrl = require('./is-real-url');

var HttpRequest = module.exports = function HttpRequest() {
	this.counter = new metrics.Counter();
	this.devCounter = new metrics.Counter();
	this.reporter = this.reporter.bind(this);
};

HttpRequest.prototype.instrument = function(req) {

	if (!req._nextInstrumented) {
		if(isRealUrl(req.originalUrl)) {
			this.counter.inc(1);
		} else {
			this.devCounter.inc(1);
		}
		req._nextInstrumented = true;
	}
};

HttpRequest.prototype.counts = function() {
	return {
		'express.http.req.count': this.counter.count,
		'express.http.req.dev.count': this.devCounter.count
	};
};

HttpRequest.prototype.reset = function() {
	this.counter.clear();
	this.devCounter.clear();
};


HttpRequest.prototype.reporter = function() {
	var counts = this.counts();
	this.reset();
	return counts;
};
