
/*
 
 Inspired by, 
 
  - http://www.slideshare.net/hoserdude/developing-highly-instrumented-applications-with-minimal-effort
  - http://ariya.ofilabs.com/2013/07/es6-and-proxy.html
  - http://en.wikipedia.org/wiki/Interceptor_pattern
  - https://github.com/scarletjs/scarlet

 Using the interceptor pattern (aka. proxies) allows us to attach arbitrary
 logging and instrumentation to our code without having to litter the code with
 lots of additional statements.

 In this example, we use Scarlet to intercept a few of the underlying node
 methods used by node-http-proxy, effectively proxying these methods via our
 own function.

 Inside our proxy function we, by way of an example, increment a (shared)
 metrics object by one.
 
 The footprint to the original code in `proxy.js` is minimal, 

    intercept.instrument(req, res);

*/

var Scarlet = require('scarlet'),
    metrics = require('metrics'),
    scarlet = new Scarlet();

var Interceptor = function () {

    var data = { 
        pipe: new metrics.Counter,
        status: {
            '2xx': new metrics.Counter,
            '3xx': new metrics.Counter,
            '4xx': new metrics.Counter,
            '5xx': new metrics.Counter
        }
    };

    var toString = function () {
        return data;
    };

    var log = function (req, res) {
        req.pipe = _logRequestPipe(req.pipe);
        res.writeHead = _logStatusCodes(res.writeHead);
    };

    // proxy for req.pipe - https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy/passes/ws-incoming.js#L81 
    var _logRequestPipe = function (fn) {
        return scarlet
            .intercept(fn)
            .using(function(proceed){
                data.pipe.inc(1);        
                proceed();
            }).proxy();
    };
   
    // proxy for res.writeHead - http://nodejs.org/api/http.html#http_response_writehead_statuscode_reasonphrase_headers
    var _logStatusCodes = function (fn) {
        return scarlet
            .intercept(fn)
            .using(function (invocation, proceed) {
                var statusCode = parseInt(invocation.args[0].toString().charAt(0));
                switch (statusCode) {
                    case 2:
                        data.status['2xx'].inc(1);
                        break;
                    case 3:
                        data.status['3xx'].inc(1);
                        break;
                    case 4:
                        data.status['4xx'].inc(1);
                        break;
                    case 5:
                        data.status['5xx'].inc(1);
                        break;
                    default:
                }
                proceed();
            }).proxy();
    };

    return {
        instrument: log,
        toString: toString
    };
};

module.exports = Interceptor;
