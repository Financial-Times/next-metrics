'use strict';
/*

 As set of proxies to help measure the performance and behaviour of an express
 app.
 
 Inspired by, 
 
  - http://www.slideshare.net/hoserdude/developing-highly-instrumented-applications-with-minimal-effort
  - http://en.wikipedia.org/wiki/Interceptor_pattern
  - https://github.com/scarletjs/scarlet

 Using the interceptor pattern allows us to attach arbitrary
 logging and instrumentation to our code without having to litter the code with
 lots of additional statements.

*/

var Proxies     = require('./metrics/');
var _           = require('lodash');
var Graphite    = require('../lib/graphite/client');
var util        = require('util');
var metrics     = require('metrics');

var apiKey = process.env.HOSTEDGRAPHITE_APIKEY;

if (!apiKey) throw "No HOSTEDGRAPHITE_APIKEY is set. Please set a false one if you are on your localhost."

var Metrics = function (opts) {

    opts = opts || {};
    
    this.opts = {};
    this.expressHttpReq = new Proxies.ExpressHttpRequest();
    this.expressHttpRes = new Proxies.ExpressHttpResponse();
    this.system         = new Proxies.System();
    this.ftApi          = new Proxies.FtApi();
    this.proxyServer    = new Proxies.ProxyServer();
    this.httpReq        = new Proxies.HttpRequest();
    this.httpRes        = new Proxies.HttpResponse();
    
    // arbitrary counters
    this.counters = {};

};

Metrics.prototype.init = function (opts) {
   
    this.opts = opts;

    // Derive the keys based on the platform, Eg, <platform>.<application>.<instance>.<metric>
    var platform = (process.env.DYNO) ? 'heroku' : 'localhost';
    var instance = (platform === 'heroku') ? process.env.DYNO.replace('.', '_') : '_';
    var isProduction = (process.env.NODE_ENV === 'production');
    
    if (!this.opts.app) throw "You need to specify an application name in the configuration options."
    
    this.graphite = new Graphite({
        apiKey: apiKey, 
        prefix: util.format('.%s.%s.%s.', platform, this.opts.app, instance),
        noLog: !isProduction
    });

    if (parseInt(this.opts.flushEvery) === 'NaN') {
        throw new Error('flushEvery must be an integer');
    }
    
    var self = this;

    setInterval(function () {
        self.flush();
    }, this.opts.flushEvery);
}

// Allow arbitrary counters
Metrics.prototype.count = function (metric, value) {
    if (!this.counters.hasOwnProperty(metric)) {
        this.counters[metric] = new metrics.Counter;
    }
    this.counters[metric].inc(value || 1);
}

Metrics.prototype.flush = function () {
   
    var customCounters = _.mapValues(this.counters, function (counter) {
        return counter.count;
    })

    // transport metrics to graphite
    this.graphite.log(_.merge(
        this.expressHttpRes.counts(),
        this.expressHttpReq.counts(),
        this.system.counts(),
        this.ftApi.counts(),
        this.proxyServer.counts(),
        this.httpReq.counts(),
        this.httpRes.counts(),
        customCounters
    ));

    // ... and reset them to zero
    _.map(this.counters, function (counter) {
        return counter.clear();
    })
    this.expressHttpReq.reset();
    this.expressHttpRes.reset();
    this.ftApi.reset();
    this.proxyServer.reset();
    this.httpReq.reset();
    this.httpRes.reset();
};

Metrics.prototype.instrument = function (obj, opts) {
    opts = opts || {};

    switch (opts.as) {
        case 'express.http.res':
            this.expressHttpRes.instrument(obj);
            break;
        case 'express.http.req':
            this.expressHttpReq.instrument(obj);
            break;
        case 'ft-api-client':
            this.ftApi.instrument(obj);
            break;
        case 'http.proxy':
            this.proxyServer.instrument(obj);
            break;   
        case 'http.request':
            this.httpReq.instrument(obj);
            break;   
        case 'http.response':
            this.httpRes.instrument(obj);
            break;            
        default:
            throw new Error('No valid "opts.as" argument given. You need to specify the object you want instrumented.');
        }
};

module.exports = new Metrics();
