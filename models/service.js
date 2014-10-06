'use strict';
var _ = require('lodash');

//  TODO - move to service model
//  Figure out which service is the default

function getDefaultServiceVersion (versions) {
	var defaultService = _.find(versions, function (service) {
		var isPrimary = service.isPrimary ? true : false;
		return isPrimary;
	});
	return defaultService;
} 

var Service = function (opts) {
   
    // TODO - model validation, throw error if invalid service definition

    this.name = opts.name;

    // TODO - Remove this (deprecated)
    this.path = opts.path;
    this.paths = opts.paths;
    this.desc = opts.desc;
    this.versions = opts.versions;

    var self = this;

    // Returns a list of versions that match a given user-agent
    var filterVersionsByUa = function (ua) {
        return _.filter(self.versions, function (version) {
            if (!version.filters) {return false;} // FIXME some data validation standards would mean we don't have 
                                                //       to litter if/else around. eg. version.filters === null
            return RegExp(version.filters['http.User-Agent']).test(ua);
        });
    };

    // Returns a list of versions that match a given version identifier
    var filterVersionsById = function (id) {
        return _.filter(self.versions, function (version, key) {
            version.id = key; // FIXME change the version object to an array
            return id === key;
        });
    };
    
    // Returns a list of versions that match a given an arbitrary list of x-headers
    var filterVersionsByXHeader = function (headers) {
        return _.filter(self.versions, function (version) {
            if (!version.filters) {return false;} // FIXME see above
            return _.some(version.filters['http.x-headers'], function (value, key) {
                return RegExp(value).test(headers[key]);
            });

        });
    };

    // Resolves a set of parameters to a given version of the service 
    this.resolve = function (opts) {

        // form a union for all the matching filters
        var filterResult = _.union(

            filterVersionsById(opts.version),           // filter by version
            filterVersionsByUa(opts.ua),                // filter by user-agent
            filterVersionsByXHeader(opts.xHeaders)      // filter by cookies
        
        );

        // FIXME taking the first matching item is simplistic, e.g. zuul has a 'priority' property
        return (!_.isEmpty(filterResult)) ? _.first(filterResult) : getDefaultServiceVersion(this.versions);

    };
};

module.exports = Service;


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
