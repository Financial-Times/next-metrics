'use strict';
var ServiceCollection = require('./serviceCollection');
var serviceProfiles = require('../server/serviceProfiles.js').getProfiles();

var services = new ServiceCollection(serviceProfiles);

var route = function (req, res) {
	
    var url = require('url').parse(req.url);
    
    var service = services.filterByPath(url.path);

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
        //res.set('x-version', (version) ? version.id : '-');

        return (version) ? version : false;

    } else {
        
        // default response
        return false; // 404
    }
};

// Load the profiles in to a model 


module.exports = function (req, res) {
    return route(req, res);
};
