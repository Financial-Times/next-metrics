    
var Scarlet = require('scarlet'),
    scarlet = new Scarlet(),
    metrics = require('metrics');

var HttpResponse = module.exports = function HttpResponse() {
    
    this.counters = {
        status_2xx:  new metrics.Counter,
        status_3xx:  new metrics.Counter,
        status_4xx:  new metrics.Counter,
        status_5xx:  new metrics.Counter
    }
    
    this.timers = {
        response_time_2xx: new metrics.Histogram.createUniformHistogram()
    }
}

HttpResponse.prototype.instrument = function (res) {
    res.writeHead = this._writeHead(res.writeHead, Date.now());
}

// proxy for res.writeHead - http://nodejs.org/api/http.html#http_response_writehead_statuscode_reasonphrase_headers
HttpResponse.prototype._writeHead = function (fn, dt) {
    var self = this;
    return scarlet
        .intercept(fn)
        .using(function (invocation, proceed) {
            var statusCode = parseInt(invocation.args[0].toString().charAt(0));
            switch (statusCode) {
                case 2:
                    self.counters.status_2xx.inc(1);
                    self.timers.response_time_2xx.update(Date.now() - dt);
                    break;
                case 3:
                    self.counters.status_3xx.inc(1);
                    break;
                case 4:
                    self.counters.status_4xx.inc(1);
                    break;
                case 5:
                    self.counters.status_5xx.inc(1);
                    break;
                default:
            }
            proceed();
        }).proxy();
    };
