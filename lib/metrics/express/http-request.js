
var Scarlet = require('scarlet'),
    scarlet = new Scarlet(),
    metrics = require('metrics');

var HttpRequest = module.exports = function HttpRequest() {
    this.counter = new metrics.Counter;
}

HttpRequest.prototype.instrument = function (req) {
    if (!req._nextInstrumented) {
	    this.counter.inc(1);
	    req._nextInstrumented = true;
	  }
}

HttpRequest.prototype.counts = function () {
    return {
        'express.http.req.count': this.counter.count
    }
}

HttpRequest.prototype.reset = function () {
    this.counter.clear();
}
