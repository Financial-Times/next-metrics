var _       = require('lodash');
var metrics = require('metrics');

var FtApi = module.exports = function FtApi() {
    this.counters = {
        item_status_2xx_response_time:      new metrics.Histogram.createUniformHistogram(),
        item_status_4xx_response_time:      new metrics.Histogram.createUniformHistogram(),
        item_status_5xx_response_time:      new metrics.Histogram.createUniformHistogram(),
        item_status_2xx:                    new metrics.Counter(),
        item_status_4xx:                    new metrics.Counter(),
        item_status_5xx:                    new metrics.Counter(),
        search_status_2xx_response_time:    new metrics.Histogram.createUniformHistogram(),
        search_status_4xx_response_time:    new metrics.Histogram.createUniformHistogram(),
        search_status_5xx_response_time:    new metrics.Histogram.createUniformHistogram(),
        search_status_2xx:                  new metrics.Counter(),
        search_status_4xx:                  new metrics.Counter(),
        search_status_5xx:                  new metrics.Counter(),
        search:                             new metrics.Counter(),
        items:                              new metrics.Counter()
    }
}

FtApi.prototype.instrument = function (obj) {

    var self = this;

    obj.on('ft-api-client:v1:requestHandler:response', function (time, response) {
       
        if (!response || !response.statusCode) {
            return false;
        }

        var statusCode = parseInt(response.statusCode.toString().charAt(0));
        switch (statusCode) {
            case 2:
                self.counters.item_status_2xx.inc(1);
                self.counters.item_status_2xx_response_time.update(time);
                break;
            case 4:
                self.counters.item_status_4xx.inc(1);
                self.counters.item_status_4xx_response_time.update(time);
                break;
            case 5:
                self.counters.item_status_5xx.inc(1);
                self.counters.item_status_5xx_response_time.update(time);
                break;
            default:
                console.err('statusCode not found', statusCode);
        } 
    })

    obj.on('ft-api-client:v1:complexSearch:response', function (time, response) {
       
        if (!response || !response.statusCode) {
            return false;
        }

        var statusCode = parseInt(response.statusCode.toString().charAt(0));
        switch (statusCode) {
            case 2:
                self.counters.search_status_2xx.inc(1);
                self.counters.search_status_2xx_response_time.update(time);
                break;
            case 4:
                self.counters.search_status_4xx.inc(1);
                self.counters.search_status_4xx_response_time.update(time);
                break;
            case 5:
                self.counters.search_status_5xx.inc(1);
                self.counters.search_status_5xx_response_time.update(time);
                break;
            default:
                console.err('statusCode not found', statusCode);
        } 
    })
    
    obj.on('ft-api-client:v1:search', function () {
        self.counters.search.inc(1);
    })

    obj.on('ft-api-client:v1:items', function () {
        self.counters.items.inc(1);
    })

}

FtApi.prototype.reset = function () {
    _.forEach(this.counters, function (counter) {
        counter.clear();
    })
}

FtApi.prototype.counts = function () {
    var c = this.counters;
    return _.zipObject(
            [
                'ft-api-client.v1.item.response.status_2xx_response_time.mean',
                'ft-api-client.v1.item.response.status_2xx_response_time.min',
                'ft-api-client.v1.item.response.status_2xx_response_time.max',
                'ft-api-client.v1.item.response.status_4xx_response_time.mean',
                'ft-api-client.v1.item.response.status_4xx_response_time.min',
                'ft-api-client.v1.item.response.status_4xx_response_time.max',
                'ft-api-client.v1.item.response.status_5xx_response_time.mean',
                'ft-api-client.v1.item.esponse.status_5xx_response_time.min',
                'ft-api-client.v1.item.response.status_5xx_response_time.max',
                'ft-api-client.v1.item.response.status_2xx.count',
                'ft-api-client.v1.item.response.status_4xx.count',
                'ft-api-client.v1.item.response.status_5xx.count',
                'ft-api-client.v1.search.response.status_2xx_response_time.mean',
                'ft-api-client.v1.search.response.status_2xx_response_time.min',
                'ft-api-client.v1.search.response.status_2xx_response_time.max',
                'ft-api-client.v1.search.response.status_4xx_response_time.mean',
                'ft-api-client.v1.search.response.status_4xx_response_time.min',
                'ft-api-client.v1.search.response.status_4xx_response_time.max',
                'ft-api-client.v1.search.response.status_5xx_response_time.mean',
                'ft-api-client.v1.search.response.status_5xx_response_time.min',
                'ft-api-client.v1.search.response.status_5xx_response_time.max',
                'ft-api-client.v1.search.response.status_2xx.count',
                'ft-api-client.v1.search.response.status_4xx.count',
                'ft-api-client.v1.search.response.status_5xx.count',
                'ft-api-client.v1.search.count',
                'ft-api-client.v1.items.count'
            ],
            [ 
                c.item_status_2xx_response_time.mean(),
                c.item_status_2xx_response_time.min,
                c.item_status_2xx_response_time.max,
                c.item_status_4xx_response_time.mean(),
                c.item_status_4xx_response_time.min,
                c.item_status_4xx_response_time.max,
                c.item_status_5xx_response_time.mean(),
                c.item_status_5xx_response_time.min,
                c.item_status_5xx_response_time.max,
                c.item_status_2xx.count,
                c.item_status_4xx.count,
                c.item_status_5xx.count,
                c.search_status_2xx_response_time.mean(),
                c.search_status_2xx_response_time.min,
                c.search_status_2xx_response_time.max,
                c.search_status_4xx_response_time.mean(),
                c.search_status_4xx_response_time.min,
                c.search_status_4xx_response_time.max,
                c.search_status_5xx_response_time.mean(),
                c.search_status_5xx_response_time.min,
                c.search_status_5xx_response_time.max,
                c.search_status_2xx.count,
                c.search_status_4xx.count,
                c.search_status_5xx.count,
                c.search.count,
                c.items.count
            ]
        )
}
