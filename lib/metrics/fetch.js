'use strict';
var metrics = require('metrics');

var Fetch = function() {
	this.counters = {};
};

Fetch.prototype.instrument = function(opts) {
	if (!GLOBAL.fetch) {
		throw 'You need to require(\'isomorphic-fetch\'); before instrumenting it';
	}
	if (GLOBAL.fetch._instrumented) {
		return console.warn('You can only instrument fetch once. Remember, if you\'re using next-express metrics for most fetch calls are setup automatically');
	}

	this.serviceMatchers = opts.serviceMatchers;
	this.onUninstrumented = opts.onUninstrumented || function() {};
	this.serviceNames = Object.keys(opts.serviceMatchers);

	this.serviceNames.forEach(function(service) {
		this.counters['fetch_' + service + '_requests'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_2xx'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_2xx_response_time'] = new metrics.Histogram.createUniformHistogram();
		this.counters['fetch_' + service + '_status_3xx'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_3xx_response_time'] = new metrics.Histogram.createUniformHistogram();
		this.counters['fetch_' + service + '_status_4xx'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_5xx'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_failed'] = new metrics.Counter();
	}.bind(this));

	require('../metrics').registerAggregator(this.reporter.bind(this));

	var _fetch = GLOBAL.fetch;

	var that = this; // not using bind as don't want to muck around with fetch's scope

	GLOBAL.fetch = function(url, opts) {
		var service;
		that.serviceNames.some(function(name) {
			if (that.serviceMatchers[name].test(url)) {
				service = name;
				return true;
			}
		});
		if (service) {
			var prefix = 'fetch_' + service;
			that.counters[prefix + '_requests'].inc(1);

			var start = new Date();

			return _fetch.apply(this, arguments)
							.then(function(res) {
								var statusType = res.status ? ('' + res.status).charAt(0) + 'xx' : '2xx';
								var timer = that.counters[prefix + '_status_' + statusType + '_response_time'];
								if (timer) {
									timer.update(new Date() - start);
								}
								that.counters[prefix + '_status_' + statusType].inc(1);
								return res;
							})
							.catch(function(err) {
								that.counters[prefix + '_status_failed'].inc(1);
								throw err;
							});

		} else {
			that.onUninstrumented.apply(this, arguments);
			return _fetch.apply(this, arguments);
		}
	};

	GLOBAL.fetch._instrumented = true;
	GLOBAL.fetch.restore = function() {
		GLOBAL.fetch = _fetch;
	};
};

Fetch.prototype.reporter = function() {

	var obj = {};

	this.serviceNames.forEach(function(service) {
		var inputPrefix = 'fetch_' + service;
		var outputPrefix = 'fetch.' + service;

		obj[outputPrefix + '.count'] = this.counters[inputPrefix + '_requests'].count;
		this.counters[inputPrefix + '_requests'].clear();

		obj[outputPrefix + '.response.status_2xx.response_time.mean'] = this.counters[inputPrefix + '_status_2xx_response_time'].mean();
		obj[outputPrefix + '.response.status_2xx.response_time.min'] = this.counters[inputPrefix + '_status_2xx_response_time'].min;
		obj[outputPrefix + '.response.status_2xx.response_time.max'] = this.counters[inputPrefix + '_status_2xx_response_time'].max;
		this.counters[inputPrefix + '_status_2xx_response_time'].clear();

		obj[outputPrefix + '.response.status_2xx.count'] = this.counters[inputPrefix + '_status_2xx'].count;
		this.counters[inputPrefix + '_status_2xx'].clear();


		obj[outputPrefix + '.response.status_3xx.response_time.mean'] = this.counters[inputPrefix + '_status_3xx_response_time'].mean();
		obj[outputPrefix + '.response.status_3xx.response_time.min'] = this.counters[inputPrefix + '_status_3xx_response_time'].min;
		obj[outputPrefix + '.response.status_3xx.response_time.max'] = this.counters[inputPrefix + '_status_3xx_response_time'].max;
		this.counters[inputPrefix + '_status_3xx_response_time'].clear();

		obj[outputPrefix + '.response.status_3xx.count'] = this.counters[inputPrefix + '_status_3xx'].count;
		this.counters[inputPrefix + '_status_3xx'].clear();

		obj[outputPrefix + '.response.status_4xx.count'] = this.counters[inputPrefix + '_status_4xx'].count;
		this.counters[inputPrefix + '_status_4xx'].clear();

		obj[outputPrefix + '.response.status_5xx.count'] = this.counters[inputPrefix + '_status_5xx'].count;
		this.counters[inputPrefix + '_status_5xx'].clear();

		obj[outputPrefix + '.response.status_failed.count'] = this.counters[inputPrefix + '_status_failed'].count;
		this.counters[inputPrefix + '_status_failed'].clear();

	}.bind(this));

	return obj;
};

module.exports = Fetch;
