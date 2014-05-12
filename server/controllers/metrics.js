// __metrics code
'use strict';

var util = require('util'),
    os = require('os');

var metrics = {
	schemaVersion: 1,
	metrics: {
        memory: {
            process: process.memoryUsage(),
            os: {
                total: os.totalmem(),
                free: os.freemem()
            }
        },
        uptime: process.uptime(),
        arch: process.arch,
        config: process.config,
        pid: process.pid,
        version: process.version,
        guid: process.getuid(),
        versions: process.versions,
        env: process.env,
        platform: os.platform(),
        load_average: os.loadavg(),
        cpus: os.cpus()
    }
};

module.exports = function (req, res) {
	res.jsonp(metrics);
};
