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

const Proxies = require('./metrics/index.js');

const _ = require('lodash');
const Graphite = require('../lib/graphite/client');
const metrics = require('metrics');
const logger = require('@financial-times/n-logger').default;

const Metrics = function () {

	this.fetch = new Proxies.Fetch();

	this.opts = {};
	this.graphites = [];
	this.aggregators = [];

	// arbitrary counters
	this.customCounters = {};
	this.customHistograms = {};
	this.hasValidConfiguration = false;
};

Metrics.prototype.init = function (opts) {
	if (this.graphite) {
		logger.warn({ event: 'NEXT_METRICS_ALREADY_CONFIGURED', message: 'Already configured, not re-initialising' });
		return;
	}

	this.opts = opts;

	let hasValidConfiguration = true;

	const FT_GRAPHITE_APP_UUID = process.env.FT_GRAPHITE_APP_UUID;

	const isProduction = (process.env.NODE_ENV === 'production');
	const disableGraphiteMetrics = (FT_GRAPHITE_APP_UUID && FT_GRAPHITE_APP_UUID === 'false');
	const noValidGraphiteAppUuid = (!FT_GRAPHITE_APP_UUID);

	if (process.env.HOSTEDGRAPHITE_APIKEY) {
		logger.warn({ event: 'NEXT_METRICS_DEPRECATED_ENV_VAR_HOSTEDGRAPHITE_APIKEY', message: 'The environment variable `HOSTEDGRAPHITE_APIKEY` is deprecated and no longer used by next-metrics' });
	}
	if (this.opts.app) {
		logger.warn({ event: 'NEXT_METRICS_DEPRECATED_OPTION_APP', message: 'The option \'app\' is deprecated and no longer used by next-metrics' });
	}
	if (this.opts.platform) {
		logger.warn({ event: 'NEXT_METRICS_DEPRECATED_OPTION_PLATFORM', message: 'The option \'platform\' is deprecated and no longer used by next-metrics' });
	}

	if (!disableGraphiteMetrics && isProduction && noValidGraphiteAppUuid) {
		hasValidConfiguration = false;
		logger.error({ event: 'NEXT_METRICS_INVALID_PRODUCTION_CONFIG', message: 'The environment variable FT_GRAPHITE_APP_UUID must be explicitly set to \'false\' if you don\'t wish to send metrics to FT\'s internal Graphite' });
	}
	if (disableGraphiteMetrics) {
		logger.info({ event: 'NEXT_METRICS_DISABLED', message: 'FT_GRAPHITE_APP_UUID is set to \'false\', metrics will not be sent to FT\'s internal Graphite' });
	}

	/**
	 * How metric prefixes work with FT GraphiteV2
	 *
	 * Prefix we send to FT GraphiteV2:
	 * 63134cae-192b-42be-90b8-c56724a3972d.web_1_process_cluster_worker_1_EU.
	 * (<uuid>.<instance>.)
	 *
	 * FT GraphiteV2 uses the UUID to authenticate the request sent by the app
	 * that is using `next-metrics`. It also replaces the UUID in the prefix
	 * that we've sent with a unique pattern that it has associated with the UUID
	 * when the app was registered with FT GraphiteV2, so the prefix we send
	 * becomes:
	 *
	 * next.heroku.front-page.web_1_process_cluster_worker_1_EU.
	 * (<team>.<platform>.<application>.<instance>.)
	 */

	const prefixKeys = [FT_GRAPHITE_APP_UUID];

	const disableInstanceKey = (this.opts.instance === false);
	if (!disableInstanceKey) {

		// e.g. "web_1"
		let instanceKey = this.opts.instance || process.env.DYNO ? process.env.DYNO.replace('.', '_') : '_';

		if (process.env.NODE_APP_INSTANCE) {
			// e.g. "web_1_process_cluster_worker_1"
			instanceKey += '_process_' + process.env.NODE_APP_INSTANCE;
		}
		if (process.env.REGION) {
			// e.g. "web_1_process_cluster_worker_1_EU"
			instanceKey += '_' + process.env.REGION;
		}
		if (process.env.FT_APP_VARIANT && process.env.FT_APP_VARIANT === 'canary') {
			// e.g. "web_1_process_cluster_worker_1_EU_canary"
			instanceKey += '_canary';
		}

		prefixKeys.push(instanceKey);
	}

	const prefix = prefixKeys.join('.') + '.';

	let noLog = false;

	// We don't want Graphite filling up with junk data from localhost
	if (!isProduction && !opts.forceGraphiteLogging) {
		noLog = true;
	}
	if (disableGraphiteMetrics || !hasValidConfiguration) {
		noLog = true;
	}

	if (noLog) {
		this.graphites.push(new Graphite({
			destination: {},
			prefix,
			noLog,
		}));
	} else {
		this.graphites.push(new Graphite({
			destination: {
				host: 'graphitev2.ft.com',
				port: 2003
			},
			prefix,
			noLog,
		}));
	}

	this.hasValidConfiguration = hasValidConfiguration;

	if(this.opts.useDefaultAggregators !== false){
		this.httpReq = new Proxies.HttpRequest();
		this.httpRes = new Proxies.HttpResponse();
		this.system = new Proxies.System();
		this.setupDefaultAggregators();
	}

	this.setupCustomAggregators();

	let self = this;

	if (this.opts.flushEvery !== false) {
		if (parseInt(this.opts.flushEvery) === 'NaN') {
			logger.error({ event: 'NEXT_METRICS_INVALID_FLUSH_EVERY_OPTION_VALUE', message: 'opts.flushEvery must be an integer' });
			return;
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
	const aggregated = _.merge.apply(this, this.aggregators.map(function (aggregator) {
		return aggregator();
	}));

	for (let i = 0; i < this.graphites.length; i++) {
		this.graphites[i].log(aggregated);
	}
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
