'use strict';
const _ = require('lodash');
const net = require('net');
const logger = require('@financial-times/n-logger').default;


const Graphite = function (opts) {
	this.destination = opts.destination;
	this.prefix = opts.prefix;
	this.noLog = opts.noLog;

	if (!this.prefix) {
		logger.error({ event: 'NEXT_METRICS_NO_PREFIX_SPECIFIED', message: 'No opts.prefix specified' });
		this.noLog = true;
		return;
	}
};

// Sends a set of metrics to Graphite
Graphite.prototype.log = function (metrics) {

	if (this.noLog) {
		return;
	}

	// Remove nulls
	// http://stackoverflow.com/questions/14058193/remove-empty-properties-falsy-values-from-object-with-underscore-js
	let noNulls = _.pickBy(metrics, _.identity);
	let time = new Date() / 1000;
	let data = _.map(noNulls, (value, key) => {
		// Graphite metric names cant have spaces, replacing spaces with _
		if ((key.indexOf(' ') >= 0 ) || (key.indexOf('\n') >= 0) || (key.indexOf('\t') >= 0)) {
			key = key.replace(/ |\n|\t/g, '_');
		}
		// Graphite metrics can only be intergers or decimal. Set value for the metrics to zero if value is not a number
		if (typeof value !== 'number') {
			value = 0;
		}
		// Graphite data can hold metrics of 255 characters. Reserving 55 characters for prefix
		if (key.length > 200) {
			let short_key = key.replace(/\./g, '').slice(-5);
			key = 'keylengtherror.' + short_key;
		}
		return `${this.prefix}${key} ${value} ${time}`;
	});

	// TODO: Now that we are no longer supporting Hosted Graphite, do we still need to chunk metrics?
	// Send data in chunks of 20 metrics (maximum allowed by hosted graphite)
	const dataChunks = _.groupBy(data, (element, index) => {
		return Math.floor(index / 20);
	});

	const { port, host } = this.destination;

	const socket = net.createConnection(port, host, function () {
		logger.debug({ event: 'NEXT_METRICS_GRAPHITE_CLIENT_CONNECTED', host });
		_.forEach(dataChunks, (chunk) => {
			socket.write(chunk.join('\n') + '\n'); // trailing \n to ensure the last metric is registered
		});
		socket.end();
	});

	socket.on('end', () => {
		logger.debug({ event: 'NEXT_METRICS_GRAPHITE_CLIENT_DISCONNECTED', host });
	});

	socket.on('error', (err) => {
		logger.error({ event: 'NEXT_METRICS_GRAPHITE_CLIENT_ERROR', host, error: err.toString() });
	});

	socket.on('timeout', () => {
		logger.error({ event: 'NEXT_METRICS_GRAPHITE_CLIENT_TIMEOUT', host });
	});

};

module.exports = Graphite;
