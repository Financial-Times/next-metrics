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

		if (matches) {
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
		// Check filters that are present for a match
		if (version.filters) {
			var filterMatch = parseFilters(req, version.filters);
			if (filterMatch) {
				return serviceName;
			} else {
				return false;
			}
		} 
	});

	// Return the matched service version otherwise the default
	if (serviceMatch) {
		return serviceMatch;
	} else {
		return service.versions['#123'];	
	}
}


function parseFilters (req, filterList) {
	// Find the first matching filter
	var filterHit = _.find(filterList, function (filter, key) {
		// Header filters
		// Cookies are a special case because the value of the Cookie header is a string of name/value pairs
		// and so need extra parsing
		if (key.indexOf('http.Cookie') === 0) {
			var cookieMatch = testCookies({
				req: req,
				filters: filter
			});
			return cookieMatch;
		} else if (key.indexOf('http.') === 0) {
			var headerMatch = testHeader({
				req: req,
				filterVal: filter,
				fiterName: key
			});
			return headerMatch;
		}
	});
	return filterHit;
}

function createMapFromArray (array, delimiter) {
	var map = {};
	array.forEach(function (arrayVal) {
		var splitData = arrayVal.split(delimiter);
		map[splitData[0]] = splitData[1];
	});
	return map;
}

function testCookies (data) {
	// Split to name/value pairs
	var cookies = data.req.header('Cookie').split('; ');

	// We need a map of the cookies to test our filters against
	var cookieMap = createMapFromArray(cookies, '=');

	// Find the first cookie filter name that matches a cookie name
	var cookieMatch = _.find(cookieMap, function (cookieVal, cookieName) {
		var filterMatch = _.find(data.filters, function (filterVal, filterName) {
			// Define the regex we want to apply
			var filterReg = new RegExp(filterVal);

			// Apply the regex test, ie test the filter specified in the profile against the value in the request
			var filterTest = filterReg.test(cookieVal);
			if (cookieName === filterName && filterTest) {
				return true;
			} else {
				return false;
			}
		});
		return filterMatch;
	});
	return cookieMatch;
}


// Test the headers for a specific value
function testHeader (data) {
	// The header names are prefixed with "http."
	var headerField = data.fiterName.split('.')[1];

	// Pull the header out of the request
	var headerVal = data.req.header(headerField);

	// Setup the regex using the string defined in the filter
	var headerFilter = new RegExp(data.filterVal);

	// If a header with the specified name exists and the regex matches...
	if (headerVal && headerFilter.test(headerVal)) {
		return true;
	} else {
		return false;
	}
}

// If no rules match fall through to the proportional traffic rules

// And an entry to the cache? At some point...

// Load balance against the pool for given service
function getHost (serviceVersion) {
	// Basic round robin type stuff
	var nodeNum = Math.ceil((Math.random() * serviceVersion.nodes.length) - 1);
	return serviceVersion.nodes[nodeNum];
}

// Make the outbound request streaming it to the output
var request = require('request');
function streamResponse (req, res, serviceVersion) {
	var host = getHost(serviceVersion);
	request('http://' + host + req.path).pipe(res);
}

// Handle requests and attempt to resolve them
function routeResolver (req, res) {
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