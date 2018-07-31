'use strict';

const Metrics = require('./lib/metrics');

module.exports.services = require('./lib/metrics/services');
module.exports.Metrics = Metrics;
module.exports.GraphiteClient = require('./lib/graphite/client');

module.exports = new Metrics();
