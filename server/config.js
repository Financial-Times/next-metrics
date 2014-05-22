'use strict';
var fs = require('fs'),
	pkg = require('../package.json');

// Heroku uses a .env file but you need to use foreman to use it by default
// this is annoying because it does not detect changes and restart on change
// so import and parse the .env file so we can use nodemon
var devEnv,
	devEnvPath = '.env';

function parseDevEnv (env) {
	var envLines = env.split('\n'),
		devEnvMap = {};

	envLines.forEach(function (lineItem) {
		var items = lineItem.split('=');
		devEnvMap[items[0]] = items[1];
	});

	return devEnvMap;
}

if (fs.existsSync(devEnvPath)) {
	devEnv = fs.readFileSync(devEnvPath, 'utf-8');
	devEnv = parseDevEnv(devEnv);
}

// Express config
exports.PORT = process.env.PORT || 5000;

// Application constants
exports.VERSION = pkg.version;
