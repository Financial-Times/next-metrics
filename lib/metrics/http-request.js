    
var Scarlet = require('scarlet'),
    scarlet = new Scarlet(),
    metrics = require('metrics');

var HttpRequest = module.exports = function HttpRequest() {
    this.counter = new metrics.Counter;
}

HttpRequest.prototype.instrument = function (req) {
    console.log('***** REQ.PIPE', req.pipe)
    req.pipe = this._pipe(req.pipe);
}

HttpRequest.prototype.counts = function () {
    return {
        'http.req.pipe': this.counter.count
    }
}

HttpRequest.prototype.reset = function () {
    console.log('****** PIPE reset', this.counter.count);
    this.counter.clear();
}

// proxy for req.pipe - https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy/passes/ws-incoming.js#L81 
HttpRequest.prototype._pipe = function (fn) {
    console.log('****** PIPE _ proxied');
    var self = this;
    return scarlet
        .intercept(fn)
        .using( function (proceed) {
            console.log('****** PIPE called', self.counter.count);
            self.counter.inc(1);
            proceed();
        }).proxy();
}
