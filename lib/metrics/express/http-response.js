"use strict";

var Scarlet = require('scarlet');
var _ = require('lodash');
var scarlet = new Scarlet();
var metrics = require('metrics');

var HttpResponse = module.exports = function HttpResponse() {
	this.counters = {
		status_2xx:  new metrics.Counter(),
		status_3xx:  new metrics.Counter(),
		status_4xx:  new metrics.Counter(),
		status_5xx:  new metrics.Counter(),
		status_2xx_response_time: new metrics.Histogram.createUniformHistogram(),
		status_4xx_response_time: new metrics.Histogram.createUniformHistogram(),
		status_5xx_response_time: new metrics.Histogram.createUniformHistogram(),
	};

	this.dynamicCounters = ['template_render_time'];

	var value = function() {
		_.invoke(this, 'clear');
	};

	for (var i= 0,l=this.dynamicCounters.length; i<l; i++) {
		this.counters[this.dynamicCounters[i]] = {};
		Object.defineProperty(this.counters[this.dynamicCounters[i]], 'clear', {
			value: value
		});
	}
	this.reporter = this.reporter.bind(this);
};

HttpResponse.prototype.instrument = function(res) {
	if (!res._nextInstrumented) {
		res.writeHead = this._writeHead(res.writeHead, Date.now());
		res.render = (function() {
			var _render = res.render.bind(res),
				httpResponse = this;

				return function renderProxy(template, data) {
					var start = process.hrtime(),
						returnValue = _render(template, data),
						diff = process.hrtime(start);

					if(!httpResponse.counters.template_render_time[template]) {
						httpResponse.counters.template_render_time[template] = new metrics.Histogram.createUniformHistogram();
					}

					httpResponse.counters.template_render_time[template].update((diff[0] * 1e9) + diff[1]);
					return returnValue;
				};

		}.bind(this)());
		res._nextInstrumented = true;
	}
};

HttpResponse.prototype.reset = function() {
	_.invoke(this.counters, 'clear');
};

HttpResponse.prototype.counts = function() {
	var c = this.counters;
	var obj = _.zipObject(
		[
			'express.http.res.status_2xx_response_time.mean',
			'express.http.res.status_2xx_response_time.stdDev',
			'express.http.res.status_2xx_response_time.min',
			'express.http.res.status_2xx_response_time.max',
			'express.http.res.status_2xx_response_time.sum',
			'express.http.res.status_4xx_response_time.mean',
			'express.http.res.status_4xx_response_time.stdDev',
			'express.http.res.status_4xx_response_time.min',
			'express.http.res.status_4xx_response_time.max',
			'express.http.res.status_4xx_response_time.sum',
			'express.http.res.status_5xx_response_time.mean',
			'express.http.res.status_5xx_response_time.stdDev',
			'express.http.res.status_5xx_response_time.min',
			'express.http.res.status_5xx_response_time.max',
			'express.http.res.status_5xx_response_time.sum',
			'express.http.res.status_2xx.count',
			'express.http.res.status_3xx.count',
			'express.http.res.status_4xx.count',
			'express.http.res.status_5xx.count',
			'express.http.res.render.min',
			'express.http.res.render.max',
			'express.http.res.render.sum',
			'express.http.res.render.mean',
			'express.http.res.render.count'
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
	// replace characters that will look odd in metrics with underscore
	function replaceOddCharactersWithUnderscore(template) {
		var safeName = template.replace(/[\/\\\.]/g, '_');
		var str = 'express.http.res.render.'+safeName+'.';
		obj[str + 'min'] = c.template_render_time[template].min;
		obj[str + 'max'] = c.template_render_time[template].max;
		obj[str + 'sum'] = c.template_render_time[template].sum;
		obj[str + 'mean'] = c.template_render_time[template].mean();
		obj[str + 'count'] = c.template_render_time[template].count;
	}

	for (var i= 0, l=this.dynamicCounters.length; i<l; i++) {
		var counter = c[this.dynamicCounters[i]];
		Object.keys(counter).forEach(replaceOddCharactersWithUnderscore);
	}

	return obj;
};

HttpResponse.prototype.reporter = function() {
	var counts = this.counts();
	this.reset();
	return counts;
};


// proxy for res.writeHead - http://nodejs.org/api/http.html#http_response_writehead_statuscode_reasonphrase_headers
HttpResponse.prototype._writeHead = function(fn, dt) {
	var self = this;
	return scarlet
		.intercept(fn)
		.using(function(invocation, proceed) {
			var statusCode = parseInt(('' + invocation.args[0]).toString().charAt(0));
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
