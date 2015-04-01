"use strict";

var Scarlet = require('scarlet');
var scarlet = new Scarlet();
var _ = require('lodash');
var metrics = require('metrics');

var HttpResponse = module.exports = function() {
	this.counters = {
		status_2xx: new metrics.Counter(),
		status_3xx: new metrics.Counter(),
		status_4xx: new metrics.Counter(),
		status_5xx: new metrics.Counter(),
		status_2xx_response_time: new metrics.Histogram.createUniformHistogram(),
		status_4xx_response_time: new metrics.Histogram.createUniformHistogram(),
		status_5xx_response_time: new metrics.Histogram.createUniformHistogram()
	};
};

HttpResponse.prototype.instrument = function(res) {
	res.writeHead = this._writeHead(res.writeHead, Date.now());
};

HttpResponse.prototype.reset = function() {
	_.forEach(this.counters, function(counter) {
		counter.clear();
	});
};

HttpResponse.prototype.counts = function() {
	var c = this.counters;
	return _.zipObject(
			[
				'http.res.status_2xx_response_time.mean',
				'http.res.status_2xx_response_time.stdDev',
				'http.res.status_2xx_response_time.min',
				'http.res.status_2xx_response_time.max',
				'http.res.status_2xx_response_time.sum',
				'http.res.status_4xx_response_time.mean',
				'http.res.status_4xx_response_time.stdDev',
				'http.res.status_4xx_response_time.min',
				'http.res.status_4xx_response_time.max',
				'http.res.status_4xx_response_time.sum',
				'http.res.status_5xx_response_time.mean',
				'http.res.status_5xx_response_time.stdDev',
				'http.res.status_5xx_response_time.min',
				'http.res.status_5xx_response_time.max',
				'http.res.status_5xx_response_time.sum',
				'http.res.status_2xx.count',
				'http.res.status_3xx.count',
				'http.res.status_4xx.count',
				'http.res.status_5xx.count',
			],
			[
				c.status_2xx_response_time.mean(),
				c.status_2xx_response_time.stdDev(),
				c.status_2xx_response_time.min,
				c.status_2xx_response_time.max,
				c.status_2xx_response_time.sum,
				c.status_4xx_response_time.mean(),
				c.status_4xx_response_time.stdDev(),
				c.status_4xx_response_time.min,
				c.status_4xx_response_time.max,
				c.status_4xx_response_time.sum,
				c.status_5xx_response_time.mean(),
				c.status_5xx_response_time.stdDev(),
				c.status_5xx_response_time.min,
				c.status_5xx_response_time.max,
				c.status_5xx_response_time.sum,
				c.status_2xx.count,
				c.status_3xx.count,
				c.status_4xx.count,
				c.status_5xx.count
			]
		);
};

// proxy for res.writeHead - http://nodejs.org/api/http.html#http_response_writehead_statuscode_reasonphrase_headers
HttpResponse.prototype._writeHead = function(fn, dt) {
	var self = this;
	return scarlet
		.intercept(fn)
		.using(function(invocation, proceed) {
			var statusCode = parseInt(invocation.args[0].toString().charAt(0));
			switch (statusCode) {
				case 2:
					self.counters.status_2xx.inc(1);
					self.counters.status_2xx_response_time.update(Date.now() - dt);
					break;
				case 3:
					self.counters.status_3xx.inc(1);
					break;
				case 4:
					self.counters.status_4xx.inc(1);
					self.counters.status_4xx_response_time.update(Date.now() - dt);
					break;
				case 5:
					self.counters.status_5xx.inc(1);
					self.counters.status_5xx_response_time.update(Date.now() - dt);
					break;
				default:
			}
			proceed();
		}).proxy();
};
