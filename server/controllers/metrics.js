// __metrics code
'use strict';

var util = require('util');

var metrics = {
	schemaVersion: 1,
	metrics: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        arch: process.arch,
        config: process.config,
        pid: process.pid,
        version: process.version,
        guid: process.getuid(),
        versions: process.versions,
        env: process.env
    }
};

module.exports = function (req, res) {
	res.jsonp(metrics);
};
