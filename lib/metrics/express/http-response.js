"use strict";

var metrics = require('metrics');

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
	if (value) {
		bucket.histogram.update(value);
	}
};

HttpResponse.prototype.instrument = function(res) {

	if (!res._nextInstrumented) {
		res.writeHead = this._writeHead(res.writeHead, res.req.method, Date.now());
		res.render = (function() {
			var _render = res.render.bind(res),
				httpResponse = this;

				return function renderProxy(template, data, callback) {
					var start = process.hrtime(),
						returnValue = _render(template, data, callback),
						diff = process.hrtime(start);

					httpResponse.measure('express.default_route_' + res.req.method + '.res.template_render.' + template, (diff[0] * 1e9) + diff[1]);
					return returnValue;
				};

		}.bind(this)());
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
	var metrics = {};
	Object.keys(this.buckets).forEach(function (key) {
		var safeKey = (key.indexOf('template' > -1) ? key.replace(/(!?:template_render)[\/\\\.]/g, '_') : key);
		metrics[safeKey + '.count'] = this.buckets[key].counter.count;
		metrics[safeKey + '.time.sum'] = this.buckets[key].histogram.sum;
		metrics[safeKey + '.time.max'] = this.buckets[key].histogram.max;
		metrics[safeKey + '.time.min'] = this.buckets[key].histogram.min;
		metrics[safeKey + '.time.mean'] = this.buckets[key].histogram.mean();
		metrics[safeKey + '.time.stdDev'] = this.buckets[key].histogram.stdDev();
	}.bind(this));

	return metrics;
};

HttpResponse.prototype.reporter = function() {
	var counts = this.counts();
	this.reset();
	return counts;
};


// proxy for res.writeHead - http://nodejs.org/api/http.html#http_response_writehead_statuscode_reasonphrase_headers
HttpResponse.prototype._writeHead = function(fn, method, dt) {
	var self = this;
	return function () {
		var statusCode = parseInt(('' + arguments[0]).toString().substr(0, 3));
		self.measure('express.default_route_' + method + '.res.status.' + statusCode, Date.now() - dt);
		return fn.apply(this, arguments);
	};
};
