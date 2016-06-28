/*eslint new-cap: 1*/
"use strict";

var metrics = require('metrics');
var isRealUrl = require('./is-real-url');

var HttpResponse = module.exports = function HttpResponse() {
	this.buckets = {};
	this.reporter = this.reporter.bind(this);
};

HttpResponse.prototype.measure = function (name, value) {
	var bucket = this.buckets[name] || (this.buckets[name] = {
		counter: new metrics.Counter(),
		histogram: new metrics.Histogram.createUniformHistogram()
	});

	bucket.counter.inc(1);
	if (typeof value !== 'undefined') {
		bucket.histogram.update(value);
	}
};

HttpResponse.prototype.instrument = function(res) {

	if (!res._nextInstrumented) {
		res.writeHead = this._writeHead(res.writeHead, res.req.method, Date.now(), isRealUrl(res.req.originalUrl));

		if (isRealUrl(res.req.originalUrl)) {
			res.render = (function() {
				var _render = res.render.bind(res);
				var httpResponse = this;

					return function renderProxy(template, data, callback) {
						var start = process.hrtime();
						var returnValue = _render(template, data, callback);
						var diff = process.hrtime(start);

						httpResponse.measure(`express.${res.nextMetricsName || 'default_route'}_${res.req.method}.res.template_render.${template}`, (diff[0] * 1e9) + diff[1]);
						return returnValue;
					};

			}.bind(this)());
		}
		res._nextInstrumented = true;
	}
};

HttpResponse.prototype.reset = function() {
	Object.keys(this.buckets).forEach(function (key) {
		this.buckets[key].counter.clear();
		this.buckets[key].histogram.clear();
	}.bind(this));
};

HttpResponse.prototype.counts = function() {
	// console.log(this.buckets);
	var metrics = {};
	Object.keys(this.buckets).forEach(function (key) {
		var safeKey = (key.indexOf('template' > -1) ? key.replace(/(!?:template_render)[\/\\\.]/g, '_') : key);
		var histo = this.buckets[key].histogram;
		const percentiles = histo.percentiles([0.5, 0.95, 0.99]);
		metrics[safeKey + '.count'] = this.buckets[key].counter.count;
		metrics[safeKey + '.time.sum'] = histo.sum;
		metrics[safeKey + '.time.max'] = histo.max;
		metrics[safeKey + '.time.min'] = histo.min;
		metrics[safeKey + '.time.mean'] = histo.mean();
		metrics[safeKey + '.time.stdDev'] = histo.stdDev();
		metrics[safeKey + '.time.median'] = percentiles[0.5];
		metrics[safeKey + '.time.95th'] = percentiles[0.95];
		metrics[safeKey + '.time.99th'] = percentiles[0.99];
	}.bind(this));

	return metrics;
};

HttpResponse.prototype.reporter = function() {
	var counts = this.counts();
	this.reset();
	return counts;
};


// proxy for res.writeHead - http://nodejs.org/api/http.html#http_response_writehead_statuscode_reasonphrase_headers
HttpResponse.prototype._writeHead = function(fn, method, dt, isReal) {
	const self = this;
	return function () {
		const statusCode = parseInt(('' + arguments[0]).toString().substr(0, 3));
		const route = isReal ? `${this.nextMetricsName || 'default_route'}_${method}` : 'dev';
		self.measure(`express.${route}.res.status.${statusCode}`, Date.now() - dt);
		return fn.apply(this, arguments);
	};
};
