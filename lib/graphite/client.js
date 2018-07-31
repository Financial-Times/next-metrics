'use strict';
const _ = require('lodash');
const net = require('net');
const logger = require('@financial-times/n-logger').default;

const Graphite = function (opts) {
	this.destination = opts.destination;
	this.prefix = opts.prefix;
	this.noLog = opts.noLog;

	if (!this.prefix) {
		throw new Error('next-metrics: No opts.prefix specified');
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

	// Send data in chunks of 20 metrics (maximum allowed by hosted graphite)
	const dataChunks = _.groupBy(data, (element, index) => {
		return Math.floor(index / 20);
	});

	const { port, host, key } = this.destination;

	const socket = net.createConnection(port, host, function () {
		_.forEach(dataChunks, (chunk) => {
			socket.write(chunk.map(chunk => key + chunk).join('\n') + '\n'); // trailing \n to ensure the last metric is registered
		});
		socket.end();
	});

	socket.on('end', function () {
		logger.debug('metrics client disconnected');
	});

	socket.on('error', function (err) {
		logger.error('metrics client error', err);
	});

	socket.on('timeout', function () {
		logger.error('metrics client timeout');
	});

};

module.exports = Graphite;
