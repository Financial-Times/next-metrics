
var metrics = require('metrics'),
    _ = require('lodash'),
    net = require('net'),
    util = require('util'),
    debug = require('debug')('graphite');

// var metrics = { 'bar': 1.2, 'foo': 2.883 }
// new Graphite({ apiKey: '1234' }).log(metrics)

var Graphite = function (opts) {
    this.apiKey = opts.apiKey;
    this.host = opts.host || "carbon.hostedgraphite.com";
    this.port = opts.port || 2003;
    this.prefix = opts.prefix;

    if (!this.prefix) throw "No opts.prefix specified";
};

// Sends a set of metrics to Graphite
// TODO - if metrics.length > 20 then split in to multiple messages
Graphite.prototype.log = function(metrics) {
   
    var self = this;

    // TODO - is it cheaper to reuse a connection?
    var socket = net.createConnection(this.port, this.host, function() {
        
        var data = _.map(metrics, function (value, k) {
            var key = self.apiKey + self.prefix + k; 
            return util.format('%s %s', key, value);
        });

        // send data in chunks of 20 metrics (maximum allowed by hosted graphite)
        var dataChunks = _.groupBy(data, function(element, index){
            return Math.floor(index / 20);
        }); 

        _.forEach(dataChunks, function (chunk) {
            debug(chunk); 
            socket.write(chunk.join("\n") + "\n"); // trailing \n to ensure the last metric is registered
        })

        socket.end();
    });

    socket.on('end', function() {
        debug('metrics client disconnected');
    });
    
    socket.on('error', function(err) {
        console.error('metrics client error', err);
    });
    
    socket.on('timeout', function() {
        console.error('metrics client timeout');
    });

}

module.exports = Graphite;
