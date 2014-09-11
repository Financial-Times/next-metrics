/*

 As set of proxies to help measure the performance and behaviour of the proxy
 server.
 
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

 Inside our proxy function we can increment a metrics object by one.
 
 The footprint to the original code in `proxy.js` is minimal, 

    metrics.instrument(req, { 'as': 'http.req' });

 Currently supported metrics :-

  - http.request
  - http.response
  - proxy
  - server
  - process

*/

var Proxies     = require('./metrics/');
var _           = require('lodash');
var Graphite    = require('../lib/graphite/client');
var util        = require('util');

// Dervie the keys based on the platform, Eg, <platform>.<application>.<instance>.<metric>
var platform = (process.env['DYNO']) ? 'heroku' : 'localhost';
var instance = (platform === 'heroku') ? process.env['DYNO'].replace('.', '_') : '_';

var graphite = new Graphite({
    apiKey: 'b2045390-ba37-42aa-b6cb-e9f2b5c56f47', // TODO move to config
    prefix: util.format('.%s.%s.%s.', platform, 'next-router', instance)
});


var Metrics = function (opts) {

    var opts = opts || {};

    this.opts = opts;
    this.httpReq        = new Proxies.HttpRequest();
    this.httpRes        = new Proxies.HttpResponse();
    this.proxyServer    = new Proxies.ProxyServer();
    this.system         = new Proxies.System();

    if (opts.flushEvery) {
        
        if (parseInt(opts.flushEvery) === 'NaN') {
            throw new Error('flushEvery must be an integer');
        }

        var self = this;
        setInterval( function () {
            self.flush();
        }, opts.flushEvery)
    }
}
    
Metrics.prototype.flush = function () {
    
    // transport metrics to graphite
    graphite.log(_.merge(
        this.httpReq.counts(),
        this.httpRes.counts(),
        this.proxyServer.counts(),
        this.system.counts()
    ));

    // ... and reset them to zero
    this.httpReq.reset();
    this.httpRes.reset();
    this.proxyServer.reset();
};

Metrics.prototype.instrument = function (obj, opts) {
    var opts = opts || {};
    switch (opts.as) {
        case 'http.res':
            this.httpRes.instrument(obj);
            break;
        case 'http.req':
            this.httpReq.instrument(obj);
            break;
        case 'http.proxy': 
            this.proxyServer.instrument(obj);
            break;
        case 'http.server':
            this.system.instrument();
            break;
        default:
            throw new Error('No valid "opts.as" argument given. You need to specify the object you want instrumented.');
    }
}

module.exports = Metrics;
