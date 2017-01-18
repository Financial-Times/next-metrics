/*eslint new-cap: 1*/
"use strict";
/*

As set of proxies to help measure the performance and behaviour of an express
app.

Inspired by,

- http://www.slideshare.net/hoserdude/developing-highly-instrumented-applications-with-minimal-effort
- http://en.wikipedia.org/wiki/Interceptor_pattern

Using the interceptor pattern allows us to attach arbitrary
logging and instrumentation to our code without having to litter the code with
lots of additional statements.

*/

var Proxies = require('./metrics/');
var _ = require('lodash');
var Graphite = require('../lib/graphite/client');
var metrics = require('metrics');

var Metrics = function(opts) {

	opts = opts || {};
	this.fetch = new Proxies.Fetch();

	this.opts = {};
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

	// Get the API keys
	var envKeys = {
		HOSTEDGRAPHITE_APIKEY: (process.env.HOSTEDGRAPHITE_APIKEY === 'false' ? false : process.env.HOSTEDGRAPHITE_APIKEY),
		FT_GRAPHITE_APIKEY: (process.env.FT_GRAPHITE_APIKEY === 'false' ? false : process.env.FT_GRAPHITE_APIKEY)
	};
	if (!opts.hostedApiKey && opts.hostedApiKey !== false) {
		opts.hostedApiKey = opts.hostedApiKey || envKeys.HOSTEDGRAPHITE_APIKEY;
		if (!opts.hostedApiKey && process.env.NODE_ENV === 'production') {
			throw new Error('No HOSTEDGRAPHITE_APIKEY is set. Please explicitly set to false if you don\'t wish to use Hosted Graphite.');
		}
	}
	if (!opts.ftApiKey && opts.ftApiKey !== false) {
		opts.ftApiKey = opts.ftApiKey || envKeys.FT_GRAPHITE_APIKEY;
		if (!opts.ftApiKey && opts.ftApiKey !== false) {
			opts.ftApiKey = opts.hostedApiKey;
		}
		if (!opts.ftApiKey && process.env.NODE_ENV === 'production') {
			throw new Error('No FT_GRAPHITE_APIKEY is set. Please explicitly set to false if you don\'t wish to use Internal Graphite.');
		}
	}

	// Derive the keys based on the platform, Eg, <platform>.<application>.<instance>.<metric>
	var platform = this.opts.platform || ((process.env.DYNO) ? 'heroku' : 'localhost');

	var isProduction = (process.env.NODE_ENV === 'production');

	if (!this.opts.app) throw "You need to specify an application name in the configuration options.";

	var prefixKeys = [platform, this.opts.app];

	// make it possible to not have an instance if it's not relevant
	// platform and app are still required
	if(this.opts.instance !== false){
		var instance = this.opts.instance || (platform === 'heroku') ? process.env.DYNO.replace('.', '_') : '_';
		if (process.env.NODE_APP_INSTANCE) {
			instance += '_process_' + process.env.NODE_APP_INSTANCE;
		}
		if (process.env.REGION) {
			instance += '_' + process.env.REGION;
		}
		prefixKeys.push(instance);
	}

	var prefix = '.' + prefixKeys.join('.') + '.';

	// If API keys have been explicitly set to `false`, we don't
	// send metrics
	var destinations = [];
	if (opts.hostedApiKey) {
		destinations.push({
			host: 'carbon.hostedgraphite.com',
			key: opts.hostedApiKey,
			port: 2003
		});
	}
	if (opts.ftApiKey) {
		destinations.push({
			host: 'graphite.ft.com',
			key: opts.ftApiKey,
			port: 2003
		});
	}

	this.graphite = new Graphite({
		destinations: destinations,
		prefix: prefix,
		noLog: !isProduction && !opts.forceGraphiteLogging
	});

	var self = this;

	if(this.opts.useDefaultAggregators !== false){
		this.httpReq = new Proxies.HttpRequest();
		this.httpRes = new Proxies.HttpResponse();
		this.system = new Proxies.System();
		this.setupDefaultAggregators();
	}

	this.setupCustomAggregators();

	if (this.opts.flushEvery !== false) {
		if (parseInt(this.opts.flushEvery) === 'NaN') {
			throw new Error('flushEvery must be an integer');
		}
		setInterval(function () {
			self.flush();
		}, this.opts.flushEvery);
	}
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

	_.each(this.customHistograms, function(histo, key){
		const percentiles = histo.percentiles([0.5, 0.95, 0.99]);
		obj[key + '.min'] = histo.min;
		obj[key + '.max'] = histo.max;
		obj[key + '.median'] = percentiles[0.5];
		obj[key + '.mean'] = histo.mean();
		obj[key + '.95th'] = percentiles[0.95];
		obj[key + '.99th'] = percentiles[0.99];
		obj[key + '.count'] = histo.count;
	});
	return obj;
};

Metrics.prototype.flushRate = function () {
	var obj = {};
	obj['flush.rate'] = this.opts.flushEvery / 1000;
	return obj;
};

Metrics.prototype.setupDefaultAggregators = function () {
	this.registerAggregator(this.system.counts);
	this.registerAggregator(this.httpReq.reporter);
	this.registerAggregator(this.httpRes.reporter);
};

Metrics.prototype.setupCustomAggregators = function(){
	this.registerAggregator(this.flushCustomCounters.bind(this));
	this.registerAggregator(this.flushCustomHistograms.bind(this));
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
			break;
		case 'express.http.req':
			this.httpReq.instrument(obj);
			break;
		default:
			throw new Error('No valid "opts.as" argument given. You need to specify the object you want instrumented.');
	}
};

Metrics.prototype.registerAggregator = function (func) {
	this.aggregators.push(func);
};

module.exports = Metrics;
