
var Proxies = require('./metrics/');
var _       = require('lodash');

var Metrics = function (opts) {

    var opts = opts || {};

    this.httpReq = new Proxies.HttpRequest();
    this.httpRes = new Proxies.HttpResponse();

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
    
        var a = {
            'httpReq.pipe': this.httpReq.counter.count
        }

        var b = _.map(this.httpRes.counters, function (k, v) {
            return _.zipObject(
                [
                    'httpRes.' + v + '.count'
                ],
                [
                    k.count
                ]
            )
        });

        var c = _.map(this.httpRes.timers, function (k, v) {
            return _.zipObject(
                    [
                        'httpRes.' + v + '.mean',
                        'httpRes.' + v + '.stdDev',
                        'httpRes.' + v + '.min',
                        'httpRes.' + v + '.max',
                        'httpRes.' + v + '.sum'
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

        console.log(a, b, c);
        
        /*
        
           
        graphite.log(_.mapValues(counters, function(d) {
            return d.count;
        }));
        
        graphite.log(_.merge(t[0], t[1]));
        
        _.forEach(counters, function(d) {
            return d.clear();
        })
        
        _.forEach(timers, function(d) {
            return d.clear();
        })
        
        */
    };

Metrics.prototype.toString = function () {
    return {
        httpReq: this.httpReq.counter,
        httpRes: this.httpRes.counters
    }
}

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
        case 'http.server':
            break;
        default:
            throw new Error('No valid "opts.as" argument given. You need to specify the object you want instrumented.');
    }
}

module.exports = Metrics;
