'use strict';
// Initialisation processes
// Load the routing map into memory
var serviceProfiles = require('../serviceProfiles.js').getProfiles();
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

var Service = function (opts) {
   
    // TODO - model validation, throw error if invalid service definition

    this.name = opts.name;
    this.path = opts.path;
    this.desc = opts.desc;
    this.versions = opts.versions;

    var self = this;

    // Returns a list of versions that match a given user-agent
    var filterVersionsByUa = function (ua) {
        return _.filter(self.versions, function (version) {
            if (!version.filters) return false; // FIXME some data validation standards would mean we don't have 
                                                //       to litter if/else around. eg. version.filters === null
            return RegExp(version.filters['http.User-Agent']).test(ua);
        });
    } 

    // Returns a list of versions that match a given version identifier
    var filterVersionsById = function (id) {
        return _.filter(self.versions, function (version, key) {
            version.id = key; // FIXME change the version object to an array
            return id === key;
        })
    } 
    
    // Returns a list of versions that match a given an arbitrary list of x-headers
    var filterVersionsByXHeader = function (headers) {
        return _.filter(self.versions, function (version) {
            if (!version.filters) return false; // FIXME see above
            return _.some(version.filters['http.x-headers'], function (value, key) {
                return RegExp(value).test(headers[key]);
            })

        })
    } 

    // Resolves a set of parameters to a given version of the service 
    this.resolve = function (opts) {

        // form a union for all the matching filters
        var filterResult = _.union(

            filterVersionsById(opts.version),           // filter by version
            filterVersionsByUa(opts.ua),                // filter by user-agent
            filterVersionsByXHeader(opts.xHeaders)      // filter by cookies
        
        );

        // FIXME taking the firt matching item is simplistic, e.g. zuul has a 'priority' property
        return (!_.isEmpty(filterResult)) ? _.first(filterResult) : getDefaultServiceVersion(this.versions);

    }  
}

var ServiceCollection = function (profiles) {

    // Covert the json to a model, i.e. var profiles:Array[Service]
    this.profiles = profiles.map(function (profile) {
        return new Service(profile);
    });
    
    // Find first matching service profile for a given URL path
    this.filterByPath = function (path) {
        return _.first(this.profiles.filter(function (profile) {
            return RegExp(profile.path).test(path);		
        }));
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
                    'x-foo':    req.headers['x-foo']
                }
            }
        );

        res.set('x-version', (version) ? version.id : '-');
	
        // TODO - handle default version
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


