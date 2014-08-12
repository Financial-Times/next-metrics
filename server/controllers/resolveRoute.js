'use strict';
// Initialisation processes
// Load the routing map into memory
var serviceProfiles = require('../serviceProfiles.js');
var l = console.log;
var _ = require('lodash');



// Validate the routing map

// Initialise an in-memory cache for paths that have been previously resolved (memoization perhaps)

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
function getServiceVersion (req, service) {
	// Iterate over the versions looking for filters
	var serviceMatch = _.find(service.versions, function (version, serviceName) {
		l('service name', serviceName);
		// Check filters that are present for a match
		if (version.filters) {
			var filterMatch = parseFilters(req, version.filters);
			l('filter hit return', filterMatch);
			if (filterMatch) {
				return serviceName;
			} else {
				return false;
			}
		} 
	});

	l('service match', serviceMatch);

	if (serviceMatch) {
		return serviceMatch;
	} else {
		return service.versions['#123'];	
	}
}


function parseFilters (req, filterList) {
	var filterHit = _.find(filterList, function (filter, key) {
		// Header filter
		if (key.indexOf('http.') === 0) {
			var headerMatch = testHeader({
				req: req,
				filterVal: filter,
				fiterName: key
			});
			l('filter hit', headerMatch);
			return headerMatch;
		}
	});
	return filterHit;
}


// Test the headers for a specific value
function testHeader (data) {
	var headerField = data.fiterName.split('.')[1];
	var headerVal = data.req.header(headerField);
	var headerFilter = new RegExp(data.filterVal);

	// If a header with the specified name exisits...
	if (headerVal && headerFilter.test(headerVal)) {
		return true;
	} else {
		return false;
	}
}

function testCookie (cookieRule, cookies) {
	return false;
}

// If no rules match fall through to the proportional traffic rules

// And an entry to the cache? At some point...

// Load balance against the pool for given service
function getHost (serviceVersion) {
	var nodeNum = Math.ceil((Math.random() * serviceVersion.nodes.length) - 1);
	l(nodeNum);
	return serviceVersion.nodes[nodeNum];
}

// Make the outbound request streaming it to the output
var request = require('request');
function streamResponse (req, res, serviceVersion) {
	var host = getHost(serviceVersion);
	l(host);
	request('http://' + host + req.path).pipe(res);
}

// Handle requests and attempt to resolve them
function routeResolver (req, res, next) {
	var service = getService(req.path, serviceProfiles.getProfiles());
	var serviceVersion;

	if (service) {
		serviceVersion = getServiceVersion(req, service);
		streamResponse(req, res, serviceVersion);
		//res.json(service);
	} else {
		res.send(404, 'No ting init');	
	}
}

// Expose the routeResolver
module.exports = routeResolver;