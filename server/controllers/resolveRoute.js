'use strict';
// Initialisation processes
// Load the routing map into memory
var serviceProfiles = require('../serviceProfiles.js').getProfiles();
var l = console.log;
var _ = require('lodash');
var debug = require('debug')('resolveRoute');

var ServiceCollection = require('../../models/serviceCollection');

// Validate the routing map
// Initialise an in-memory cache for paths that have been previously resolved (memoization perhaps)
// Create static route maps for each service based on the proportion of traffic each may have specified
// Create static route maps base on filters?
// Create routing pools based on hosts in the routing file, these will maintain the state of each node 
// in the pool (polling __gtg for each)
// When resolving a route
// Determine which service should handle the traffic:
// Check for a cache entry for previously resolved routes at the service level



// Check to see if requestor has been here before and direct accordingly

// returns an array with 100 elements each representing 1% load
//  TODO - move to service model
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

// Make the outbound request streaming it to the output
var request = require('request');

function streamResponse (req, res, serviceVersion) {
    var host = _.sample(serviceVersion.nodes, 1)[0];
	request('http://' + host + req.path).pipe(res);
}

// Handle requests and attempt to resolve them
function routeResolver (req, res) {
	
    var service = services.filterByPath(req.path);
  
    if (service) {
       

        var version = service.resolve(
            {
                version:    req.headers['x-version'],
                ua:         req.headers['user-agent'],
                xHeaders:   {
                    'x-foo':    req.headers['x-foo']  // FIXME pass all x-headers by default
                }
            }
        );

        // Annotate the response with the version we are going to proxy
        res.set('x-version', (version) ? version.id : '-');
	
        streamResponse(req, res, version);

    } else {
        // default response
        res.status(404).send('No ting init');	
    }
}

// Load the profiles in to a model 
var services = new ServiceCollection(serviceProfiles)

// Expose the routeResolver
module.exports = routeResolver;

