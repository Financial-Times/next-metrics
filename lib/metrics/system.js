    
var Scarlet = require('scarlet');
var _       = require('lodash');
var os      = require('os');
    
var scarlet = new Scarlet();
var metrics = require('metrics');


var System = module.exports = function System() {
    this.counters = {
        'system.mem_process_rss': new metrics.Counter,
        'system.mem_process_heapTotal': new metrics.Counter,
        'system.mem_process_heapUsed': new metrics.Counter,
        'system.load_average_1m': new metrics.Counter
    }
}

System.prototype.instrument = function (req) {
    var self = this;
    setInterval(function () {
        var mem = process.memoryUsage();
        self.counters['system.mem_process_rss'].count = mem.rss;
        self.counters['system.mem_process_heapTotal'].count = mem.heapTotal;
        self.counters['system.mem_process_heapUsed'].count = mem.heapUsed;
        self.counters['system.load_average_1m'].count = _.first(os.loadavg());
    }, 5000)
}

System.prototype.counts = function () {
    return {
        'system.mem_process_rss': this.counters['system.mem_process_rss'].count,
        'system.mem_process_heapTotal': this.counters['system.mem_process_heapTotal'].count,
        'system.mem_process_heapUsed': this.counters['system.mem_process_heapUsed'].count,
        'system.load_average_1m': this.counters['system.load_average_1m'].count
    }
}
