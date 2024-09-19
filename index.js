'use strict';

const logger = require('@dotcom-reliability-kit/logger');

const silence = Boolean(process.env.NEXT_METRICS_SILENCE_WARNINGS);

/**
 * @template T
 * @param {string} signature
 * @param {T} returnValue
 * @returns {() => T}
 */
function buildDeprecationLogger (signature, returnValue) {
	return () => {
		if (!silence) {
			const error = new Error(`${signature} no longer does anything. Please remove it from your code`);
			logger.warn(error, {
				event: 'NEXT_METRICS_DEPRECATION',
				message: `Call to ${signature} found`
			});
		}
		return returnValue;
	};
}

/**
 * @param {function} classFn
 * @param {string} methodName
 * @param {any} returnValue
 */
function addDeprecatedMethod (classFn, methodName, returnValue = undefined) {
	classFn.prototype[methodName] = buildDeprecationLogger(`${classFn.name}#${methodName}()`, returnValue);
}

/**
 * @param {function} classFn
 * @param {string} propertyName
 * @param {any} value
 */
function addDeprecatedProperty (classFn, propertyName, value) {
	Object.defineProperty(classFn.prototype, propertyName, {
		get: buildDeprecationLogger(`${classFn.name}#${propertyName}[get]`, value),
		set: buildDeprecationLogger(`${classFn.name}#${propertyName}[set]`, value)
	});
}

// Create a fetcher that matches the old API but doesn't actually
// do anything. We only instrument methods we know are used
class Fetcher {}
addDeprecatedMethod(Fetcher, 'instrument');

// Create a metrics client that matches the old API but doesn't
// actually do anything. We only instrument methods we know are used
class Metrics {}
addDeprecatedProperty(Metrics, 'opts', {});
addDeprecatedProperty(Metrics, 'graphites', []);
addDeprecatedProperty(Metrics, 'aggregators', []);
addDeprecatedProperty(Metrics, 'customCounters', {});
addDeprecatedProperty(Metrics, 'customHistograms', {});
addDeprecatedProperty(Metrics, 'hasValidConfiguration', false);
addDeprecatedProperty(Metrics, 'services', {});
addDeprecatedProperty(Metrics, 'fetch', new Fetcher());
addDeprecatedMethod(Metrics, 'init');
addDeprecatedMethod(Metrics, 'count');
addDeprecatedMethod(Metrics, 'histogram');
addDeprecatedMethod(Metrics, 'flushCustomCounters');
addDeprecatedMethod(Metrics, 'flushCustomHistograms');
addDeprecatedMethod(Metrics, 'flushRate');
addDeprecatedMethod(Metrics, 'setupDefaultAggregators');
addDeprecatedMethod(Metrics, 'setupCustomAggregators');
addDeprecatedMethod(Metrics, 'flush');
addDeprecatedMethod(Metrics, 'instrument');
addDeprecatedMethod(Metrics, 'registerAggregator');

// Create a graphite client that matches the old API but doesn't
// actually do anything. We only instrument methods we know are used
class GraphiteClient {}
addDeprecatedProperty(GraphiteClient, 'destination', { port: 137, host: 'localhost' });
addDeprecatedProperty(GraphiteClient, 'prefix', 'deprecated');
addDeprecatedProperty(GraphiteClient, 'noLog', false);
addDeprecatedMethod(GraphiteClient, 'log');

module.exports = new Metrics();
module.exports.Metrics = Metrics;
module.exports.GraphiteClient = GraphiteClient;
