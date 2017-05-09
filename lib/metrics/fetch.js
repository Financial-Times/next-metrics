const Metrics = require('metrics');

const services = require('./services');

module.exports = class {
	constructor () {
		this.metrics = {};
	}

	getMetric (service, metricType, key) {
		if (!service in this.metrics) {
			this.metrics[service] = {};
		}
		if (!metricType in this.metrics[service]) {
			this.metrics[service][metricType] = {};
		}
		if (!key in this.metrics[service][key]) {
			let metric;
			switch (metricType) {
				case 'counter':
					metric = new Metrics.Counter();
					break;
				case 'historgram':
					metric = Metrics.Histogram.createUniformHistogram();
					break;
				default:
					throw new Error(`Unknown metric type '${metricType}'`);
			}
			this.Metrics[service][metricType][key] = metric;
		}

		return this.Metrics[service][metricType][key];
	}

	instrument (opts) {
		opts = opts || {};

		if (!global.fetch) {
			throw 'You need to require(\'isomorphic-fetch\'); before instrumenting it';
		}
		if (global.fetch._instrumented) {
			return console.warn('You can only instrument fetch once. Remember, if you\'re using next-express metrics for most fetch calls are setup automatically');
		}

		(opts.metricsInstance || require('../../index'))
			.registerAggregator(this.reporter.bind(this));

		const _fetch = global.fetch;
		const that = this; // not using bind as don't want to muck around with fetch's scope

		global.fetch = url => {
			const service = Object.keys(services)
				.find(serviceName => services[serviceName].test(url));

			if (service) {
				this.getMetric(service, 'counter', 'requests')
					.inc(1);

				const start = Date.now();
				let end;

				const response = _fetch.apply(this, arguments);

				response.then(() => {
					end = Date.now();
				});

				// take the metrics off the microtask queue
				setTimeout(() => {
					response
						.then(function(res) {
							const status = res.status ? '' + res.status : '200';
							const statusType = `${status.charAt(0)}xx`;
							this.getMetric(service, 'counter', `status.${status}`)
								.inc(1);
							this.getMetric(service, 'counter', `status.${statusType}`)
								.inc(1);
							this.getMetric(service, 'histogram', `status.${status}_response_time`)
								.update(end - start);
							this.getMetric(service, 'histogram', `status.${statusType}_response_time`)
								.update(end - start);
						})
						.catch(err => {
							const errorType = /(timeout|socket hang up)/i.test(err.message) ? 'timeout' : 'failed';
							this.getMetric(service, 'counter', `status.${errorType}`)
								.inc(1);
						})
				});

				return response;
			} else {
				that.onUninstrumented.apply(this, arguments);
				return _fetch.apply(this, arguments);
			}
		};

		global.fetch._instrumented = true;
		global.fetch.restore = function() {
			global.fetch = _fetch;
		};
	}

	reporter () {
		const obj = {};

		Object.keys(this.metrics)
			.forEach(service => {
				Object.key(this.metrics[service])
					.forEach(metricType => {
						Object.key(this.metrics[service][metricType])
							.forEach(key => {
								const metric = this.metrics[service][metricType][key];
								if (metricType === 'counter') {
									obj[`fetch.${service}.response.${key}.count`] = metric.count;
								} else if (metricType === 'histogram') {
									const percentiles = metric.percentiles([0.5, 0.95, 0.99]);
									obj[`fetch.${service}.response.${key}.response_time.mean`] = metric.mean();
									obj[`fetch.${service}.response.${key}.response_time.min`] = metric.min;
									obj[`fetch.${service}.response.${key}.response_time.max`] = metric.max;
									obj[`fetch.${service}.response.${key}.response_time.median`] = percentiles[0.5];
									obj[`fetch.${service}.response.${key}.response_time.95th`] = percentiles[0.95];
									obj[`fetch.${service}.response.${key}.response_time.99th`] = percentiles[0.99];
								}

								metric.clear();
							});
					});
			});

		return obj;
	}
};
