const Metrics = require('./lib/metrics');

module.exports = new Metrics();

module.exports.services = require('./metrics/services');
