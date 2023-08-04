const Metrics = require('metrics');
const services = require('./services');
const logger = require('@dotcom-reliability-kit/logger');

module.exports = class {
	constructor (deps = {}) {
		this.deps = Object.assign({}, { Metrics, services }, deps);
		this.metrics = {};
	}

	getMetric (service, metricType, key = '') {
		if (!(service in this.metrics)) {
			this.metrics[service] = {};
		}
		if (!(key in this.metrics[service])) {
			let metric;
			switch (metricType) {
				case 'counter':
					metric = new this.deps.Metrics.Counter();
					break;
				case 'histogram':
					metric = this.deps.Metrics.Histogram.createUniformHistogram();
					break;
				default:
					throw new Error(`next-metrics: Unknown metric type '${metricType}'`);
			}
			this.metrics[service][key] = metric;
		}

		return this.metrics[service][key];
	}

	instrument ({ metricsInstance, onUninstrumented = () => {}} = {}) {
		if (!global.fetch && !this.deps.fetchInstance) {
			throw new Error('next-metrics: You need to `require(\'isomorphic-fetch\');` or pass a fetchInstance as an option before instrumenting it');
		}

		const useGlobalFetch = this.deps.overrideGlobalFetch !== false;
		const fetchInstance = this.deps.fetchInstance || global.fetch;

		if (fetchInstance._instrumented) {
			return logger.warn({ event: 'NEXT_METRICS_FETCH_ALREADY_INSTRUMENTED', message: 'You can only instrument fetch once. Remember, if you\'re using next-express metrics, most fetch calls are setup automatically' });
		}



		// FIXME: dynamic require so it doesn't get in a circular loop
		(metricsInstance || require('../../index'))
			.registerAggregator(this.reporter.bind(this));

		const that = this; // not using bind as don't want to muck around with fetch's scope

		let fetchInstrumented = function (url) {
			const service = Object.keys(that.deps.services)
				.find(serviceName => that.deps.services[serviceName].test(url));

			if (service) {
				that.getMetric(service, 'counter')
					.inc(1);

				const start = Date.now();
				let end;

				const response = fetchInstance.apply(this, arguments);
				response.then(() => {
					end = Date.now();
				}).catch(() => {}); // empty catch as exceptions are handled in other promise chains

				// take the metrics off the microtask queue
				setTimeout(() => {
					response.then(res => {
						const status = res.status ? '' + res.status : '200';
						const statusType = `${status.charAt(0)}xx`;
						that.getMetric(service, 'counter', `response.status_${status}`)
							.inc(1);
						that.getMetric(service, 'counter', `response.status_${statusType}`)
							.inc(1);
						that.getMetric(service, 'histogram', `response.status_${status}.response_time`)
							.update(end - start);
						that.getMetric(service, 'histogram', `response.status_${statusType}.response_time`)
							.update(end - start);
					})
						.catch(err => {
							const errorType = /(timeout|socket hang up)/i.test(err.message) ? 'timeout' : 'failed';
							that.getMetric(service, 'counter', `response.status_${errorType}`)
								.inc(1);
						});
				});

				return response;
			} else {
				onUninstrumented.apply(this, arguments);
				return fetchInstance.apply(this, arguments);
			}
		};

		fetchInstrumented._instrumented = true;
		fetchInstrumented._fromFetchInstance = !!this.deps.fetchInstance;
		fetchInstrumented.restore = () => {
			fetchInstrumented = fetchInstance;
			if(useGlobalFetch)
				global.fetch = fetchInstance;

		};

		if(useGlobalFetch)
			global.fetch = fetchInstrumented;

		return fetchInstrumented;
	}

	getMetricReport (service, key = '') {
		const metric = this.metrics[service] && this.metrics[service][key];
		if (!metric) {
			return {};
		}
		const actualKey = key === '' ? '' : `.${key}`;
		let metricReport;
		if (metric instanceof this.deps.Metrics.Counter) {
			metricReport = {
				[`fetch.${service}${actualKey}.count`]: metric.count
			};
		} else if (metric instanceof this.deps.Metrics.Histogram) {
			const percentiles = metric.percentiles([0.5, 0.95, 0.99]);
			metricReport = {
				[`fetch.${service}${actualKey}.mean`]: metric.mean(),
				[`fetch.${service}${actualKey}.min`]: metric.min,
				[`fetch.${service}${actualKey}.max`]: metric.max,
				[`fetch.${service}${actualKey}.median`]: percentiles[0.5],
				[`fetch.${service}${actualKey}.95th`]: percentiles[0.95],
				[`fetch.${service}${actualKey}.99th`]: percentiles[0.99],
			};
		}
		metric.clear();

		return metricReport;
	}

	getServiceReport (service) {
		return Object.keys(this.metrics[service])
			.reduce((serviceReportAcc, key) => {
				return Object.assign({}, serviceReportAcc, this.getMetricReport(service, key));
			}, {});
	}

	reporter () {
		return Object.keys(this.metrics)
			.reduce((reportAcc, service) => {
				return Object.assign({}, reportAcc, this.getServiceReport(service));
			}, {});
	}
};
