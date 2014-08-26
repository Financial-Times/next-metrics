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
    Graphite = require('../lib/graphite/client'),
    os = require('os'),
    scarlet = new Scarlet();
    _ = require('lodash');

var net = require('net');

var graphite = new Graphite( { apiKey: 'b2045390-ba37-42aa-b6cb-e9f2b5c56f47' } ); // TODO move to config

var Metrics = function () {

    var counters = { 
        pipe:        new metrics.Counter,
        status_2xx:  new metrics.Counter,
        status_3xx:  new metrics.Counter,
        status_4xx:  new metrics.Counter,
        status_5xx:  new metrics.Counter,
        connections: new metrics.Counter,
        'system.mem_process_rss':        new metrics.Counter,
        'system.mem_process_heapTotal':  new metrics.Counter,
        'system.mem_process_heapUsed':   new metrics.Counter,
        'system.load_average_1m':        new metrics.Counter
    };
    
    var timers = {    
        response_time_2xx:               new metrics.Histogram.createUniformHistogram(),
        bytes_read:                      new metrics.Histogram.createUniformHistogram()
    }

    var toString = function () {
        return {
            counters: counters,
            timers: timers
        }
    };

    var flush = function () {
        
        graphite.log(_.mapValues(counters, function(d) {
            return d.count;
        }));
  
        var t = _.map(timers, function (k, v) {
            return _.zipObject(
                    [
                        v + '.mean',
                        v + '.stdDev',
                        v + '.min',
                        v + '.max',
                        v + '.sum'
                    ],
                    [ 
                        k.mean(),
                        k.stdDev(),
                        k.min,
                        k.max,
                        k.sum
                    ]
                )
            })

        graphite.log(_.merge(t[0], t[1]));

        _.forEach(counters, function(d) {
            return d.clear();
        })
        
        _.forEach(timers, function(d) {
            return d.clear();
        })

    };

    var instrumentProxy = function(proxy) {
        proxy.emit = _log(proxy.emit);
    }

    var instrumentServer = function(server) {
        setInterval(function () {
            server.getConnections(function (err, n) {
                counters.connections.count = n // TODO 
            })
        }, 5000)
    }
    
    var instrumentSystem = function(server) {
        setInterval(function () {
            var mem = process.memoryUsage();
            counters['system.mem_process_rss'].count = mem.rss;
            counters['system.mem_process_heapTotal'].count = mem.heapTotal;
            counters['system.mem_process_heapUsed'].count = mem.heapUsed;
            counters['system.load_average_1m'].count = _.first(os.loadavg());
        }, 5000)
    }

    var log = function (req, res, proxy) {
        req.pipe = _logRequestPipe(req.pipe);
        res.writeHead = _logStatusCodes(res.writeHead, Date.now());
    };
    
    var _log = function (fn) {
        return scarlet
            .intercept(fn)
            .using(function(invocation, proceed) {
                if (invocation.args[0] === 'proxyRes') {
                    timers.bytes_read.update(invocation.args[1].connection.bytesRead);
                }
                proceed();
            }).proxy();
    };

    // proxy for req.pipe - https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy/passes/ws-incoming.js#L81 
    var _logRequestPipe = function (fn) {
        return scarlet
            .intercept(fn)
            .using(function(proceed){
                counters.pipe.inc(1);        
                proceed();
            }).proxy();
    };
   
    // proxy for res.writeHead - http://nodejs.org/api/http.html#http_response_writehead_statuscode_reasonphrase_headers
    var _logStatusCodes = function (fn, dt) {
        return scarlet
            .intercept(fn)
            .using(function (invocation, proceed) {
                var statusCode = parseInt(invocation.args[0].toString().charAt(0));
                switch (statusCode) {
                    case 2:
                        counters.status_2xx.inc(1);
                        timers.response_time_2xx.update(Date.now() - dt);
                        break;
                    case 3:
                        counters.status_3xx.inc(1);
                        break;
                    case 4:
                        counters.status_4xx.inc(1);
                        break;
                    case 5:
                        counters.status_5xx.inc(1);
                        break;
                    default:
                }
                proceed();
            }).proxy();
    };

    return {
        instrument: log,
        toString: toString,
        flush: flush,
        instrumentProxy: instrumentProxy,
        instrumentServer: instrumentServer,
        instrumentSystem: instrumentSystem
    };
};

module.exports = Metrics;
