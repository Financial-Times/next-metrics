'use strict';
// const Scarlet = require('scarlet');
// const scarlet = new Scarlet();
const metrics = require('metrics');
const isRealUrl = require('./is-real-url');

const HttpRequest = module.exports = function HttpRequest () {
	this.counter = new metrics.Counter();
	this.devCounter = new metrics.Counter();
	this.reporter = this.reporter.bind(this);
};

HttpRequest.prototype.instrument = function (req) {

	if (!req._nextInstrumented) {
		if(isRealUrl(req.originalUrl)) {
			this.counter.inc(1);
		} else {
			this.devCounter.inc(1);
		}
		req._nextInstrumented = true;
	}
};

HttpRequest.prototype.counts = function () {
	// (next-router) does not have the express prefix and has more options
	return {
		'express.http.req.count': this.counter.count,
		'express.http.req.dev.count': this.devCounter.count
	};
};

HttpRequest.prototype.reset = function () {
	this.counter.clear();
	this.devCounter.clear();
};


HttpRequest.prototype.reporter = function () {
	let counts = this.counts();
	this.reset();
	return counts;
};

// (next-router) does not have the express prefix and has more options
// proxy for req.pipe - https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy/passes/ws-incoming.js#L81
// HttpRequest.prototype._pipe = function (fn) {
// 	return scarlet
// 		.intercept(fn)
// 		.using(function (proceed) {
// 			this.counter.inc(1);
// 			proceed();
// 		}.bind(this)).proxy();
// };
