'use strict';
var route = function (req, res, services) {
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


module.exports = function (req, res, services) {
    return route(req, res, services);
};
