/*eslint new-cap: 1*/
'use strict';
/*

A set of proxies to help measure the performance and behaviour of an express app.

Inspired by,

- http://www.slideshare.net/hoserdude/developing-highly-instrumented-applications-with-minimal-effort
- http://en.wikipedia.org/wiki/Interceptor_pattern

Using the interceptor pattern allows us to attach arbitrary
logging and instrumentation to our code without having to litter the code with
lots of additional statements.

*/

const FT_GRAPHITE_HOSTNAME = 'graphiteV2.ft.com';

const Proxies = require('./metrics/');
const _ = require('lodash');
const Graphite = require('../lib/graphite/client');
const metrics = require('metrics');
const logger = require('@financial-times/n-logger').default;

const Metrics = function () {

	this.fetch = new Proxies.Fetch();

	this.opts = {};
	this.aggregators = [];

	// arbitrary counters
	this.customCounters = {};
	this.customHistograms = {};
};

Metrics.prototype.init = function (opts) {
	if (this.graphite) {
		logger.warn('next-metrics: Already configured, not re-initialising');
		return;
	}

	this.opts = opts;

	let FT_GRAPHITE_APIKEY = process.env.FT_GRAPHITE_APIKEY;
	let FT_GRAPHITE_UUID = process.env.FT_GRAPHITE_UUID;

	const isProduction = (process.env.NODE_ENV === 'production');
	const disableGraphiteMetrics = (FT_GRAPHITE_APIKEY && FT_GRAPHITE_APIKEY === 'false');
	const noValidGraphiteApiKey = (!FT_GRAPHITE_APIKEY);
	const noValidGraphiteUuid = (!FT_GRAPHITE_UUID);

	if (!this.opts.app) {
		throw new Error('next-metrics: You need to specify an application name in the configuration options. See the next-metrics README: https://github.com/Financial-Times/next-metrics');
	}
	if (!disableGraphiteMetrics && isProduction && noValidGraphiteApiKey) {
		throw new Error('next-metrics: The environment variable FT_GRAPHITE_APIKEY must be explicitly set to \'false\' if you don\'t wish to send metrics to FT\'s internal Graphite');
	}
	if (noValidGraphiteUuid) {
		throw new Error('next-metrics: The environment variable FT_GRAPHITE_UUID is missing');
	}
	if (disableGraphiteMetrics) {
		logger.info('next-metrics: FT_GRAPHITE_APIKEY is set to \'false\', metrics will not be sent to FT\'s internal Graphite');
	}

	// Derive the keys based on the platform e.g. <platform>.<application>.<instance>.<metric>
	const platform = this.opts.platform || ((process.env.DYNO) ? 'heroku' : 'localhost');

	let prefixKeys = [platform, this.opts.app];

	// make it possible to not have an instance if it's not relevant
	// platform and app are still required
	if(this.opts.instance !== false){
		let instance = this.opts.instance || (platform === 'heroku') ? process.env.DYNO.replace('.', '_') : '_';
		if (process.env.NODE_APP_INSTANCE) {
			instance += '_process_' + process.env.NODE_APP_INSTANCE;
		}
		if (process.env.REGION) {
			instance += '_' + process.env.REGION;
		}
		prefixKeys.push(instance);
	}

	const prefix = '.' + prefixKeys.join('.') + '.';

	let noLog = false;

	// We don't want Graphite filling up with junk data from localhost
	if (!isProduction && !opts.forceGraphiteLogging) {
		noLog = true;
	}
	if (disableGraphiteMetrics) {
		noLog = true;
	}

	const destination = (noLog) ? {} : {
		host: FT_GRAPHITE_HOSTNAME,
		key: FT_GRAPHITE_UUID,
		port: 2003
	};

	this.graphite = new Graphite({
		destination,
		prefix,
		noLog,
	});

	let self = this;

	if(this.opts.useDefaultAggregators !== false){
		this.httpReq = new Proxies.HttpRequest();
		this.httpRes = new Proxies.HttpResponse();
		this.system = new Proxies.System();
		this.setupDefaultAggregators();
	}

	this.setupCustomAggregators();

	if (this.opts.flushEvery !== false) {
		if (parseInt(this.opts.flushEvery) === 'NaN') {
			throw new Error('next-metrics: flushEvery must be an integer');
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
Metrics.prototype.histogram = function (metric, value){
	if (!this.customHistograms.hasOwnProperty(metric)) {
		this.customHistograms[metric] = new metrics.Histogram.createUniformHistogram();
	}
	this.customHistograms[metric].update(value);
};

Metrics.prototype.flushCustomCounters = function () {
	return _.mapValues(this.customCounters, function (counter) {
		let val = counter.count;
		counter.clear();
		return val;
	});
};

Metrics.prototype.flushCustomHistograms = function () {
	let obj = {};

	_.each(this.customHistograms, function (histo, key){
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
	let obj = {};
	obj['flush.rate'] = this.opts.flushEvery / 1000;
	return obj;
};

Metrics.prototype.setupDefaultAggregators = function () {
	this.registerAggregator(this.system.counts);
	this.registerAggregator(this.httpReq.reporter);
	this.registerAggregator(this.httpRes.reporter);
};

Metrics.prototype.setupCustomAggregators = function (){
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
			throw new Error('next-metrics: No valid "opts.as" argument given. You need to specify the object you want instrumented.');
	}
};

Metrics.prototype.registerAggregator = function (func) {
	this.aggregators.push(func);
};

module.exports = Metrics;
