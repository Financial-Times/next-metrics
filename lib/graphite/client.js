"use strict";
var _ = require('lodash');
var net = require('net');
var debug = require('debug')('graphite');

var Graphite = function(opts) {
	this.destinations = opts.destinations;
	this.prefix = opts.prefix;
	this.noLog = opts.noLog;

	if (!this.prefix) throw "No opts.prefix specified";
};

// Sends a set of metrics to Graphite
Graphite.prototype.log = function(metrics) {

	// Remove nulls
	// http://stackoverflow.com/questions/14058193/remove-empty-properties-falsy-values-from-object-with-underscore-js
	var noNulls = _.pick(metrics, _.identity);
	var time = new Date() / 1000;
	var data = _.map(noNulls, (value, k) => {
		return `${this.prefix}${k} ${value} ${time}`;
	});

	// Send data in chunks of 20 metrics (maximum allowed by hosted graphite)
	var dataChunks = _.groupBy(data, (element, index) => {
		return Math.floor(index / 20);
	});

	debug(data.join("\n"));

	// We don't want Graphite filling up with junk data from localhost
	// so we disabled it when this flag is set, which is current by the
	// NODE_ENV environment flag.

	if (this.noLog) {
		console.warn(`Logging to Graphite is disabled by default on non-production environments.
To enable it set NODE_ENV to "production".`);
		return;
	}

	this.destinations.forEach(conf => {
		const socket = net.createConnection(conf.port, conf.host, function() {
			_.forEach(dataChunks, function(chunk) {
				debug(chunk.map(chunk => conf.key + chunk));
				socket.write(chunk.map(chunk => conf.key + chunk).join("\n") + "\n"); // trailing \n to ensure the last metric is registered
			});
			socket.end();
		});

		socket.on('end', function() {
			debug('metrics client disconnected');
		});

		socket.on('error', function(err) {
			console.error('metrics client error', err);
		});

		socket.on('timeout', function() {
			console.error('metrics client timeout');
		});
	})
};

module.exports = Graphite;
