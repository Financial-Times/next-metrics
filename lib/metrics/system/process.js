/*eslint new-cap: 1, no-extend-native: 1*/
"use strict";
var os = require('os');

var metrics = require('metrics');
var profiler = require('gc-profiler');

var System = function() {

	var versionTokens = process.version.split('.');

	this.nodeVersion = {
		major: parseInt(versionTokens[0].slice(1)) || 0,
		minor: parseInt(versionTokens[1]),
		patch: parseInt(versionTokens[2])
	};

	this.counters = {
		'system.process.mem_process_rss': new metrics.Counter(),
		'system.process.mem_process_heapTotal': new metrics.Counter(),
		'system.process.mem_process_heapUsed': new metrics.Counter(),
		'system.process.load_average_1m': new metrics.Counter(),
		'system.process.next_tick': new metrics.Histogram.createUniformHistogram(),
		'system.process.garbage_collection': new metrics.Histogram.createUniformHistogram()
	};

	this.counts = this.counts.bind(this);

	this.instrument();
};

System.prototype.instrument = function() {
	var self = this;

	// read memory / cpu information from process module
	setInterval(function() {
		var mem = process.memoryUsage();
		self.counters['system.process.mem_process_rss'].count = mem.rss;
		self.counters['system.process.mem_process_heapTotal'].count = mem.heapTotal;
		self.counters['system.process.mem_process_heapUsed'].count = mem.heapUsed;
		self.counters['system.process.load_average_1m'].count = (os.loadavg() || [])[0];
	}, 5000);

	profiler.on('gc', function (info) {
		self.counters['system.process.garbage_collection'].update(info.duration);
	});

	// event loop timing via high-resolution real time function
	function timeTick() {
		var start = process.hrtime();
		function onTick() {
			var diff = process.hrtime(start);
			var nanoSecondsDiff = (diff[0] * 1e9) + diff[1];
			self.counters['system.process.next_tick'].update(nanoSecondsDiff);
		}
		process.nextTick(onTick);
	}
	setInterval(timeTick, 1000);
};

System.prototype.counts = function() {
	const nextTickHisto = this.counters['system.process.next_tick'];
	const gcHisto = this.counters['system.process.next_tick'];
	const nextTickPercentiles = nextTickHisto.percentiles([0.5, 0.95, 0.99]);
	const gcPercentiles = gcHisto.percentiles([0.5, 0.95, 0.99]);

	return {
		'system.os.cpus': os.cpus().length,
		'system.process.uptime': process.uptime(),
		'system.process.version.full': process.version,
		'system.process.version.major': this.nodeVersion.major,
		'system.process.version.minor': this.nodeVersion.minor,
		'system.process.version.patch': this.nodeVersion.patch,
		'system.process.mem_process_rss': this.counters['system.process.mem_process_rss'].count,
		'system.process.mem_process_heapTotal': this.counters['system.process.mem_process_heapTotal'].count,
		'system.process.mem_process_heapUsed': this.counters['system.process.mem_process_heapUsed'].count,
		'system.process.load_average_1m': this.counters['system.process.load_average_1m'].count,
		'system.process.next_tick.mean': nextTickHisto.mean(),
		'system.process.next_tick.stdDev': nextTickHisto.stdDev(),
		'system.process.next_tick.min': nextTickHisto.min,
		'system.process.next_tick.max': nextTickHisto.max,
		'system.process.next_tick.sum': nextTickHisto.sum,
		'system.process.next_tick.median': nextTickPercentiles[0.5],
		'system.process.next_tick.95th': nextTickPercentiles[0.95],
		'system.process.next_tick.99th': nextTickPercentiles[0.99],
		'system.process.garbage_collection.count': gcHisto.count,
		'system.process.garbage_collection.mean': gcHisto.mean(),
		'system.process.garbage_collection.stdDev': gcHisto.stdDev(),
		'system.process.garbage_collection.min': gcHisto.min,
		'system.process.garbage_collection.max': gcHisto.max,
		'system.process.garbage_collection.sum': gcHisto.sum,
		'system.process.garbage_collection.median': gcPercentiles[0.5],
		'system.process.garbage_collection.95th': gcPercentiles[0.95],
		'system.process.garbage_collection.99th': gcPercentiles[0.99]
	};
};

module.exports = System;
