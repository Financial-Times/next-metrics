"use strict";
var _ = require('lodash');
var net = require('net');
var util = require('util');
var debug = require('debug')('graphite');

var Graphite = function(opts) {
	this.apiKey = opts.apiKey;
	this.host = opts.host || "carbon.hostedgraphite.com";
	this.port = opts.port || 2003;
	this.prefix = opts.prefix;
	this.noLog = opts.noLog;

	if (!this.prefix) throw "No opts.prefix specified";
};

// Sends a set of metrics to Graphite
Graphite.prototype.log = function(metrics) {
	var self = this;

	// Remove nulls
	// http://stackoverflow.com/questions/14058193/remove-empty-properties-falsy-values-from-object-with-underscore-js
	var noNulls = _.pick(metrics, _.identity);

	var data = _.map(noNulls, function(value, k) {
		return util.format('%s%s%s %s %d', self.apiKey, self.prefix, k, value, new Date() / 1000);
	});

	// Send data in chunks of 20 metrics (maximum allowed by hosted graphite)
	var dataChunks = _.groupBy(data, function(element, index){
		return Math.floor(index / 20);
	});

	debug(data.join("\n"));

	// We don't want Graphite filling up with junk data from localhost
	// so we disabled it when this flag is set, which is current by the
	// NODE_ENV environment flag.

	if (this.noLog) {
		console.warn('Logging to Graphite is disabled by default on non-production environments. To enable is set NODE_ENV to "production".');
		return;
	}

	// update the specified hosted graphite
	var socket = net.createConnection(this.port, this.host, function() {
		_.forEach(dataChunks, function(chunk) {
			socket.write(chunk.join("\n") + "\n"); // trailing \n to ensure the last metric is registered
		});
		socket.end();
	});

	socket.on('end', function() {
		debug('metrics client disconnected');
	});

	socket.on('error', function(err) {
		console.error('metrics client error', err);
	});

	socket.on('close', function(err) {
		console.error('metrics client closed', err);
	});

	socket.on('timeout', function() {
		console.error('metrics client timeout');
	});

	// now push the same data again to the FT graphite cluster:
	// This is hardcoded, because when/if we cut over we want this to disappear.
	// and just change the original graphite details instead
	var ftSocket = net.createConnection(2003, "graphite.ft.com", function() {
		_.forEach(dataChunks, function(chunk) {
		ftSocket.write(chunk.join("\n") + "\n"); // trailing \n to ensure the last metric is registered
	});
		ftSocket.end();
	});

	ftSocket.on('end', function() {
		debug('metrics client disconnected');
	});

	ftSocket.on('error', function(err) {
		console.error('metrics client error', err);
	});

	ftSocket.on('close', function(err) {
		console.error('metrics client closed', err);
	});

	ftSocket.on('timeout', function() {
		console.error('metrics client timeout');
	});
};

module.exports = Graphite;
