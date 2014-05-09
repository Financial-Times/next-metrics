
var domain      = require('domain'),
    request     = require('request'),
    _           = require('lodash'),
    Q           = require('q'),
    flags       = {},
    poller,
    refreshInterval = 5000; // FIXME too quick :)

// A simple model of a flag
var Flag = function (opts) {
    var opts = opts || {};
    this.state = opts.state || false;
    this.lastUpdated = new Date();
}

Flag.prototype.isSwitchedOn = function () {
    return !!this.state;
}

Flag.prototype.isSwitchedOff = function () {
    return !!!this.state;
}

module.exports = {
   
    get: function () {
        return flags;
    },

    stop: function () {
        clearInterval(poller);
        poller = undefined;
    },

    hydrate: function (url) {

        // FIXME allow only a single instance of the interval

        poller = setInterval(function () {
        
            var d = domain.create().on("error", function(err) {
                console.log('**', err)
            });

            var promisedFlags = function (flagUrl) { 
                var deferred = Q.defer();
                request(flagUrl, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log('flag promise has been resolved with response', body);
                        deferred.resolve(JSON.parse(body));
                    }
                })
                return deferred.promise;
            };

            d.run(function () {;

                console.log('fetching flags', new Date())
              
                // hydrate the flag models 
                promisedFlags(url)  // TODO at then/end/complete etc.
                    .then(function (f) { 
                        flags = _.mapValues(f, function (s) {
                            return new Flag({ state : s })
                        })
                    });


                // test that errors are scoped to this domain
                if ((Math.random() * 1000) < 1) {
                    throw new Error('meeeeeeeeeeep!')
                }
            });

        }, refreshInterval)
    }

}
