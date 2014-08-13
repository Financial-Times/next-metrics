'use strict';
// Initialisation processes
// Load the routing map into memory
var serviceProfiles = require('../serviceProfiles.js');
var l = console.log;
var _ = require('lodash');
var debug = require('debug')('resolveRoute');

// Validate the routing map

// Initialise an in-memory cache for paths that have been previously resolved (memoization perhaps)

// Create static route maps for each service based on the proportion of traffic each may have specified

// Create static route maps base on filters?

// Create routing pools based on hosts in the routing file, these will maintain the state of each node 
// in the pool (polling __gtg for each)


// When resolving a route
// Determine which service should handle the traffic:
// Check for a cache entry for previously resolved routes at the service level

var ServiceCollection = function (profiles) {

    this.profiles = profiles;
    
    // Find first matching service profile for a given URL path
    this.filterByPath = function (path) {
        return _.first(this.profiles.filter(function (profile) {
            return RegExp(profile.path).test(path);		
        }))
    }

}



// Figure out which service is the default
function getDefaultServiceVersion (versions) {
	var defaultService = _.find(versions, function (service) {
		var isPrimary = service.isPrimary ? true : false;
		return isPrimary;
	});
	return defaultService;
} 

// Check to see if requestor has been here before and direct accordingly

// Iterate over header/cookie filters for each version, the first matching rules wins
function getServiceVersion (req, service) {
	// Generate to loadmap
	var loadMap = defineLoadDistribution(service.versions);

	// Iterate over the versions looking for filters
	var versionMatch = _.find(service.versions, function (version, serviceName) {
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
	if (versionMatch) {
		return versionMatch;
	} else {
		return _.sample(loadMap, 1)[0];
	}
}

// returns an array with 100 elements each representing 1% load
function defineLoadDistribution (versions) {
	var totalLoad = 100;
	var loadMap = [];

	// Parse the versions looking for load allocations
	var versionsWithLoadDefinition = _.filter(versions, function (version) {
		if (version.filters && version.filters.load) {
			return true;
		}
	});

	// For each allocation add an entries into the map
	_.each(versionsWithLoadDefinition, function (version) {
		for (var i = 0; i < version.filters.load; i++) {
			totalLoad--;
			loadMap.push(version);
		}
	});

	// For the remainder of the load add the default service versions
	var defaultVersion = getDefaultServiceVersion(versions);

	for (var j = 0; j < totalLoad; j++) {
		loadMap.push(defaultVersion);
	}

	return loadMap;
}

// Iterate over all the filter types, this just returns true if any filter matches
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

// Cookies need extra parsing because them come in as a big old string
function testCookies (data) {
	// Split to name/value pairs
    
    if (!data.req.header('Cookie')) return false;

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


// Make the outbound request streaming it to the output
var request = require('request');
function streamResponse (req, res, serviceVersion) {
	var host = _.sample(serviceVersion.nodes, 1)[0];
	request('http://' + host + req.path).pipe(res);
}

// Handle requests and attempt to resolve them
function routeResolver (req, res) {
	
    var service = services.filterByPath(req.path);

	var serviceVersion;


	if (service) {
		serviceVersion = getServiceVersion(req, service);
		streamResponse(req, res, serviceVersion);
	} else {
		res.status(404).send('No ting init');	
	}
}

var services = new ServiceCollection(serviceProfiles.getProfiles())

// Expose the routeResolver
module.exports = routeResolver;
