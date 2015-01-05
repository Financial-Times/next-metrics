'use strict';

var _       = require('lodash');
var metrics = require('metrics');

var FtApi = module.exports = function FtApi() {
    this.counters = {};
    this.reportFields = [];
    this.reportGetters = [];
};

FtApi.prototype.setupResponseHandler = function (type) { 

    // slightly dirty simple check to see if setup already done, but can't see it ever going wrong
    if (!this.counters[type + '_status_2xx_response_time']) {
        ['2xx', '4xx', '5xx'].forEach(function (statusCode) {
            this.counters[type + '_status_' + statusCode + '_response_time'] = new metrics.Histogram.createUniformHistogram();
            this.counters[type + '_status_' + statusCode] = new metrics.Counter();

            this.reportFields = this.reportFields.concat([
                'ft-api-client.v1.' + type + '.response.status_' + statusCode + '_response_time.mean',
                'ft-api-client.v1.' + type + '.response.status_' + statusCode + '_response_time.min',
                'ft-api-client.v1.' + type + '.response.status_' + statusCode + '_response_time.max'
            ]);

            this.reportGetters = this.reportGetters.concat([
                function () { return this.counters[type + '_status_' + statusCode + '_response_time'].mean(); }.bind(this),
                function () { return this.counters[type + '_status_' + statusCode + '_response_time'].min; }.bind(this),
                function () { return this.counters[type + '_status_' + statusCode + '_response_time'].max; }.bind(this)
            ]);

        }.bind(this));
    }

    return function (time, response) {
       
        if (!response || !response.statusCode) {
            return false;
        }

        var statusCode = parseInt(response.statusCode.toString().charAt(0), 10);
        switch (statusCode) {
            case 2:
                this.counters[type + '_status_2xx'].inc(1);
                this.counters[type + '_status_2xx_response_time'].update(time);
                break;
            case 4:
                this.counters[type + '_status_4xx'].inc(1);
                this.counters[type + '_status_4xx_response_time'].update(time);
                break;
            case 5:
                this.counters[type + '_status_5xx'].inc(1);
                this.counters[type + '_status_5xx_response_time'].update(time);
                break;
            default:
                console.err('statusCode not found', statusCode);
        }
    }.bind(this);
};

FtApi.prototype.setupRequestHandler = function (type, obj) {
    this.counters[type] = new metrics.Counter();
    this.reportFields.push('ft-api-client.v1.' + type + '.count');
    this.reportGetters.push(function () {
        return this.counters[type].count;
    }.bind(this));
    
    obj.on('ft-api-client:v1:' + type, function () {
        this.counters[type].inc(1);
    }.bind(this));
};


FtApi.prototype.instrument = function (obj) {

    this.setupRequestHandler('items', obj);
    this.setupRequestHandler('search', obj);
    this.setupRequestHandler('elasticSearch', obj);

    obj.on('ft-api-client:v1:requestHandler:response:resolved', this.setupResponseHandler('item'));
    obj.on('ft-api-client:v1:requestHandler:response:rejected', this.setupResponseHandler('item'));
    obj.on('ft-api-client:v1:complexSearch:response:resolved', this.setupResponseHandler('search'));
    obj.on('ft-api-client:v1:complexSearch:response:rejected', this.setupResponseHandler('search'));
    obj.on('ft-api-client:v1:elasticSearch:response:resolved', this.setupResponseHandler('elasticSearch'));
    obj.on('ft-api-client:v1:elasticSearch:response:rejected', this.setupResponseHandler('elasticSearch'));

};

FtApi.prototype.reset = function () {
    _.forEach(this.counters, function (counter) {
        counter.clear();
    });
};

FtApi.prototype.counts = function () {
    return _.zipObject(this.reportFields, this.reportGetters.map(function (getter) {
        return getter();
    }));
};
