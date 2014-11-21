
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
    this.noLog = opts.noLog;

    if (!this.prefix) throw "No opts.prefix specified";
};

// Sends a set of metrics to Graphite
Graphite.prototype.log = function(metrics) {
   
    var self = this;
        
    var data = _.map(metrics, function (value, k) {
        return util.format('%s%s%s %s', self.apiKey, self.prefix, k, value);
    });

    // Send data in chunks of 20 metrics (maximum allowed by hosted graphite)
    var dataChunks = _.groupBy(data, function(element, index){
        return Math.floor(index / 20);
    }); 

    debug(dataChunks); 
  
    // We don't want Graphite filling up with junk data from localhost
    // so we disabled it when this flag is set, which is current by the
    // NODE_ENV environment flag.
    
    if (this.noLog) {
        console.warn('Logging to Graphite is disabled by default on non-production environments. To enable is set NODE_ENV to "production".')
        return;
    }

    var socket = net.createConnection(this.port, this.host, function() {
        _.forEach(dataChunks, function (chunk) {
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
