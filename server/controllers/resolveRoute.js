'use strict';
// Initialisation processes
// Load the routing map into memory
var serviceProfiles = require('../serviceProfiles.js').getProfiles();
var l = console.log;
var _ = require('lodash');
var debug = require('debug')('resolveRoute');

var ServiceCollection = require('../../models/serviceCollection');

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

