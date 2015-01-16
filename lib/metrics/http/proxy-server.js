"use strict";

var Scarlet = require('scarlet');
var _ = require('lodash');

var scarlet = new Scarlet();
var metrics = require('metrics');

var ProxyServer = module.exports = function HttpRequest() {
	this.bytesRead = new metrics.Histogram.createUniformHistogram();
};

ProxyServer.prototype.instrument = function (proxy) {
	proxy = this._emit(proxy);
};

ProxyServer.prototype.counts = function () {
	return _.zipObject(
		[
			'proxy-server.bytes-read.mean',
			'proxy-server.bytes-read.stdDev',
			'proxy-server.bytes-read.min',
			'proxy-server.bytes-read.max',
			'proxy-server.bytes-read.sum'
		],
		[
			this.bytesRead.mean(),
			this.bytesRead.stdDev(),
			this.bytesRead.min,
			this.bytesRead.max,
			this.bytesRead.sum
		]
	);
};

ProxyServer.prototype.reset = function () {
	this.bytesRead.clear();
};

// proxy for req.pipe - https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy/passes/ws-incoming.js#L81
ProxyServer.prototype._emit = function (fn) {
	return scarlet
		.intercept(fn)
		.using(function(invocation, proceed) {
			if (invocation.args[0] === 'proxyRes') {
				this.bytesRead.update(invocation.args[1].connection.bytesRead);
			}
			proceed();
		}.bind(this)).proxy();
};
