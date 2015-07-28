"use strict";
/*

 As set of proxies to help measure the performance and behaviour of an express
 app.

 Inspired by,

  - http://www.slideshare.net/hoserdude/developing-highly-instrumented-applications-with-minimal-effort
  - http://en.wikipedia.org/wiki/Interceptor_pattern
  - https://github.com/scarletjs/scarlet

 Using the interceptor pattern allows us to attach arbitrary
 logging and instrumentation to our code without having to litter the code with
 lots of additional statements.

*/

var Proxies = require('./metrics/');
var _ = require('lodash');
var Graphite = require('../lib/graphite/client');
var util = require('util');
var metrics = require('metrics');

var apiKey = process.env.HOSTEDGRAPHITE_APIKEY;

if (!apiKey && process.env.NODE_ENV === 'production') throw "No HOSTEDGRAPHITE_APIKEY is set. Please set a false one if you are on your localhost.";

var Metrics = function(opts) {

	opts = opts || {};

	this.opts = {};
	this.httpReq		= new Proxies.HttpRequest();
	this.httpRes		= new Proxies.HttpResponse();
	this.httpResV2		= new Proxies.HttpResponseV2();
	this.system		 = new Proxies.System();
	this.fetch		  = new Proxies.Fetch();
	this.ftApiClient	= new Proxies.FtApiClient();
	this.aggregators = [];

	// arbitrary counters
	this.customCounters = {};
	this.customHistograms = {};
};

Metrics.prototype.init = function(opts) {
	if (this.graphite) {
		console.warn("Metrics already configured, not re-initialising");
		return;
	}

	this.opts = opts;

	// Derive the keys based on the platform, Eg, <platform>.<application>.<instance>.<metric>
	var platform = (process.env.DYNO) ? 'heroku' : 'localhost';
	var instance = (platform === 'heroku') ? process.env.DYNO.replace('.', '_') : '_';
	var isProduction = (process.env.NODE_ENV === 'production');

	if (!this.opts.app) throw "You need to specify an application name in the configuration options.";

	this.graphite = new Graphite({
		apiKey: apiKey,
		prefix: util.format('.%s.%s.%s.', platform, this.opts.app, instance),
		noLog: !isProduction
	});

	if (parseInt(this.opts.flushEvery) === 'NaN') {
		throw new Error('flushEvery must be an integer');
	}

	var self = this;

	this.setupDefaultAggregators();

	setInterval(function () {
		self.flush();
	}, this.opts.flushEvery);
};

// Allow arbitrary counters
Metrics.prototype.count = function (metric, value) {
	if (!this.customCounters.hasOwnProperty(metric)) {
		this.customCounters[metric] = new metrics.Counter();
	}
	this.customCounters[metric].inc(value || 1);
};

// Allow arbitrary Histograms
Metrics.prototype.histogram = function(metric, value){
	if (!this.customHistograms.hasOwnProperty(metric)) {
		this.customHistograms[metric] = new metrics.Histogram.createUniformHistogram();
	}
	this.customHistograms[metric].update(value);
};

Metrics.prototype.flushCustomCounters = function () {
	return _.mapValues(this.customCounters, function (counter) {
		var val = counter.count;
		counter.clear();
		return val;
	});
};

Metrics.prototype.flushCustomHistograms = function () {
	var obj = {};
	_.each(this.customHistograms, function(value, key){
		obj[key + '.min'] = value.min;
		obj[key + '.max'] = value.max;
		obj[key + '.mean'] = value.mean();
		obj[key + '.count'] = value.count;
	});
	return obj;
};

Metrics.prototype.flushRate = function () {
	var obj = {};
	obj['flush.rate'] = this.opts.flushEvery / 1000;
	return obj;
};

Metrics.prototype.setupDefaultAggregators = function () {
	this.registerAggregator(this.flushCustomCounters.bind(this));
	this.registerAggregator(this.flushCustomHistograms.bind(this));
	this.registerAggregator(this.httpReq.reporter);
	this.registerAggregator(this.httpRes.reporter);
	this.registerAggregator(this.httpResV2.reporter);
	this.registerAggregator(this.system.counts);
	this.registerAggregator(this.ftApiClient.reporter);
	this.registerAggregator(this.flushRate.bind(this));
};

Metrics.prototype.flush = function () {
	// transport metrics to graphite
	this.graphite.log(_.merge.apply(this, this.aggregators.map(function (aggregator) {
		return aggregator();
	})));
};

Metrics.prototype.instrument = function (obj, opts) {
	opts = opts || {};

	switch (opts.as) {
		case 'express.http.res':
			this.httpRes.instrument(obj);
			this.httpResV2.instrument(obj);
			break;
		case 'express.http.req':
			this.httpReq.instrument(obj);
			break;
		case 'ft-api-client':
			this.ftApiClient.instrument(obj);
			break;
		default:
			throw new Error('No valid "opts.as" argument given. You need to specify the object you want instrumented.');
	}
};

Metrics.prototype.registerAggregator = function (func) {
	this.aggregators.push(func);
};

module.exports = new Metrics();
