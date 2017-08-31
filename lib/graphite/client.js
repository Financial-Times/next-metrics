'use strict';
const _ = require('lodash');
const net = require('net');
const debug = require('debug')('graphite');
const logger = require('@financial-times/n-logger').default;

const Graphite = function (opts) {
	this.destinations = opts.destinations;
	this.prefix = opts.prefix;
	this.noLog = opts.noLog;

	if (!this.prefix) throw 'No opts.prefix specified';
};

// Sends a set of metrics to Graphite
Graphite.prototype.log = function (metrics) {

	// Remove nulls
	// http://stackoverflow.com/questions/14058193/remove-empty-properties-falsy-values-from-object-with-underscore-js
	let noNulls = _.pick(metrics, _.identity);
	let time = new Date() / 1000;
	let data = _.map(noNulls, (value, k) => {
		return `${this.prefix}${k} ${value} ${time}`;
	});

	// Send data in chunks of 20 metrics (maximum allowed by hosted graphite)
	const dataChunks = _.groupBy(data, (element, index) => {
		return Math.floor(index / 20);
	});

	debug(data.join('\n'));

	// We don't want Graphite filling up with junk data from localhost
	// so we disabled it when this flag is set, which is current by the
	// NODE_ENV environment flag.

	if (this.noLog) {
		logger.warn(`Logging to Graphite is disabled by default on non-production environments.
To enable it set NODE_ENV to "production".`);
		return;
	}

	this.destinations.forEach(conf => {
		const socket = net.createConnection(conf.port, conf.host, function () {
			_.forEach(dataChunks, function (chunk) {
				socket.write(chunk.map(chunk => conf.key + chunk).join('\n') + '\n'); // trailing \n to ensure the last metric is registered
			});
			socket.end();
		});

		socket.on('end', function () {
			debug('metrics client disconnected');
		});

		socket.on('error', function (err) {
			logger.error('metrics client error', err);
		});

		socket.on('timeout', function () {
			logger.error('metrics client timeout');
		});
	});
};

module.exports = Graphite;
