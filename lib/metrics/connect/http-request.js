const Scarlet = require('scarlet');
const scarlet = new Scarlet();
const metrics = require('metrics');

const HttpRequest = module.exports = function HttpRequest () {
	this.counter = new metrics.Counter();
	this.reporter = this.reporter.bind(this);
};

HttpRequest.prototype.instrument = function (req) {
	req.pipe = this._pipe(req.pipe);
};

HttpRequest.prototype.counts = function () {
	return {
		'http.req.pipe': this.counter.count
	};
};

HttpRequest.prototype.reset = function () {
	this.counter.clear();
};

HttpRequest.prototype.reporter = function () {
	let counts = this.counts();
	this.reset();
	return counts;
};

// proxy for req.pipe - https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy/passes/ws-incoming.js#L81
HttpRequest.prototype._pipe = function (fn) {
	return scarlet
		.intercept(fn)
		.using(function (proceed) {
			this.counter.inc(1);
			proceed();
		}.bind(this)).proxy();
};
