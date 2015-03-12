    
var Scarlet = require('scarlet'),
    scarlet = new Scarlet(),
    metrics = require('metrics');

var ExpressHttpRequest = module.exports = function ExpressHttpRequest() {
    this.counter = new metrics.Counter;
}

ExpressHttpRequest.prototype.instrument = function (req) {
    this.counter.inc(1);
}

ExpressHttpRequest.prototype.counts = function () {
    return {
        'express.http.req.count': this.counter.count
    }
}

ExpressHttpRequest.prototype.reset = function () {
    this.counter.clear();
}
