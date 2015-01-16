    
var Scarlet = require('scarlet'),
    scarlet = new Scarlet(),
    metrics = require('metrics');

var HttpRequest = module.exports = function HttpRequest() {
    this.counter = new metrics.Counter;
}

HttpRequest.prototype.instrument = function (req) {
    this.counter.inc(1);
}

HttpRequest.prototype.counts = function () {
    return {
        'express.http.req.count': this.counter.count
    }
}

HttpRequest.prototype.reset = function () {
    this.counter.clear();
}
