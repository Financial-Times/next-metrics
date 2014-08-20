'use strict';
GLOBAL.Promise = require('es6-promise').Promise;
var Poller = require('ft-poller');

// Poll the service registry for service data
var getServiceProfiles = function (cfg) {
	var profileFetcher =  new Poller({
	    url: cfg.url, 
	    refreshInterval: 10000,
	    parseData: cfg.cb // When the data arrives invoke the passed callback
	});

	// Start polling requesting an immediate fetch of data
	profileFetcher.start({ initialRequest: true });	
};

module.exports.getServiceProfiles = getServiceProfiles;