'use strict';
const _ = require('lodash');
const net = require('net');
const logger = require('@dotcom-reliability-kit/logger');

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
	let data = _.map(noNulls, (value, k) => {
		return `${this.prefix}${k} ${value} ${time}`;
	});

	// TODO: Now that we are no longer supporting Hosted Graphite, do we still need to chunk metrics?
	// Send data in chunks of 20 metrics (maximum allowed by hosted graphite)
	const dataChunks = _.groupBy(data, (element, index) => {
		return Math.floor(index / 20);
	});

	const { port, host } = this.destination;

	const socket = net.createConnection(port, host, function () {
		_.forEach(dataChunks, (chunk) => {
			socket.write(chunk.join('\n') + '\n'); // trailing \n to ensure the last metric is registered
		});
		socket.end();
	});

	socket.on('error', (err) => {
		logger.error({ event: 'NEXT_METRICS_GRAPHITE_CLIENT_ERROR', host, error: err.toString() });
	});

	socket.on('timeout', () => {
		logger.error({ event: 'NEXT_METRICS_GRAPHITE_CLIENT_TIMEOUT', host });
	});

};

module.exports = Graphite;
