const _ = require('lodash');

const Scarlet = require('scarlet');
const scarlet = new Scarlet();
const metrics = require('metrics');

const ProxyServer = module.exports = function HttpRequest () {
	const CreateUniformHistogram = metrics.Histogram.createUniformHistogram;
	this.bytesRead = new CreateUniformHistogram();
	this.events = { };
	this.events.start = new metrics.Counter();
	this.events.end = new metrics.Counter();
	this.events.proxyRes = new metrics.Counter();
	this.events.error = new metrics.Counter();
	this.events.hangUp = new metrics.Counter();
};

ProxyServer.prototype.instrument = function (proxy) {

	let self = this;

	proxy.on('start', function () {
		self.events.start.inc(1);
	});

	proxy.on('end', function () {
		self.events.end.inc(1);
	});

	proxy.on('proxyRes', function () {
		self.events.proxyRes.inc(1);
	});

	proxy.on('error', function () {
		self.events.error.inc(1);
	});

	proxy = this._emit(proxy);
};

ProxyServer.prototype.counts = function () {
	return _.zipObject(
		[
			'proxy-server.bytes-read.mean',
			'proxy-server.bytes-read.stdDev',
			'proxy-server.bytes-read.min',
			'proxy-server.bytes-read.max',
			'proxy-server.bytes-read.sum',
			'proxy-server.events.start.count',
			'proxy-server.events.end.count',
			'proxy-server.events.proxyRes.count',
			'proxy-server.events.error.count',
			'proxy-server.events.hangUp.count'
		],
		[
			this.bytesRead.mean(),
			this.bytesRead.stdDev(),
			this.bytesRead.min,
			this.bytesRead.max,
			this.bytesRead.sum,
			this.events.start.count,
			this.events.end.count,
			this.events.proxyRes.count,
			this.events.error.count,
			this.events.hangUp.count
		]
	);
};

ProxyServer.prototype.reporter = function () {
	let counts = this.counts();
	this.reset();
	return counts;
};

ProxyServer.prototype.reset = function () {
	this.bytesRead.clear();
	_.forEach(this.events, function (counter) {
		counter.clear();
	});
};

ProxyServer.prototype._emit = function (fn) {
	return scarlet
		.intercept(fn)
		.using(function (invocation, proceed) {
			if (invocation.args[0] === 'proxyRes' && invocation.args[1].connection) {
				this.bytesRead.update(invocation.args[1].connection.bytesRead);
			}
			proceed();
		}.bind(this)).proxy();
};
