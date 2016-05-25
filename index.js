const Metrics = require('./lib/metrics');

module.exports = new Metrics();

module.exports.services = require('./lib/metrics/services');

module.exports.Metrics = Metrics;
