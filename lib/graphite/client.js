'use strict';
const _ = require('lodash');
const net = require('net');
const logger = require('@financial-times/n-logger').default;
const sanitiseMetrics = require('./sanitise-metrics')


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

	const metrics_prefix = this.prefix;
	const data = sanitiseMetrics({
								metrics_prefix,
								metrics
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
