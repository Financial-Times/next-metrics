'use strict';
// Initialisation processes
// Load the routing map into memory
var serviceProfiles = require('../serviceProfiles.js');
var l = console.log;

// Validate the routing map

// Initialise an in-memory cache for paths that have been previously resolved

// Create static route maps for each service based on the proportion of traffic each may have specified

// Create static route maps base on filters?

// Create routing pools based on hosts in the routing file, these will maintain the state of each node in the pool (polling __gtg for each)


// When resolving a route
// Determine which service should handle the traffic:
// Check for a cache entry for previously resolved routes at the service level

// Iterate over the services
function getService (path, profiles) {
	var serviceProfile = false;

	// Find a service path regex that matches against the current path
	var serviceMatch = profiles.some(function (currentService) {
		var reg = new RegExp(currentService.path);		
		var matches = reg.test(path);

		if (matches > 0) {
			serviceProfile = currentService;
			return true;
		} else {
			return false;
		}
	});

	if (serviceMatch !== false) {
		return serviceProfile;
	} else {
		return false;
	}
}

// Check to see if requestor has been here before and direct accordingly

// Iterate over header/cookie filters for each version, the first matching rules wins
function getServiceVersion (path, service) {
	return service.versions['#123'];
}

// If no rules match fall through to the proportional traffic rules

// And an entry to the cache? At some point...

// Load balance against the pool for given service
function getHost (serviceVersion) {
	return serviceVersion.nodes[0];
}

// Make the outbound request streaming it to the output
var request = require('request');
function streamResponse (req, res, serviceVersion) {
	var host;
	host = getHost(serviceVersion);
	request('http://' + host).pipe(res);
}

// Handle requests and attempt to resolve them
function routeResolver (req, res, next) {
	var service = getService(req.path, serviceProfiles.getProfiles());
	var serviceVersion;

	if (service) {
		serviceVersion = getServiceVersion(req.path, service);
		streamResponse(req, res, serviceVersion);
		//res.json(service);
	} else {
		res.send(404, 'No ting init');	
	}
}

// Expose the routeResolver
module.exports = routeResolver;