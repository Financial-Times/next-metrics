/* global describe, it, after */
'use strict';

var request = require('superagent'),
    mocha = require('mocha'),
    nock = require('nock'),
    expect = require('chai').expect;

var mock = nock('http://next-service-registry.herokuapp.com').get('/services').reply(200, {services: false}, {'Content-Type': 'application/json'});

var app = require('../proxy'),
    host = 'http://localhost:5000',
    server = app.listen(5000);

after(function () {
  server.close();
});

describe('Router error', function () {
    it('Respond with a 503 when requesting a valid service path', function (done) {
        //var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/badger').reply(503, '');
        request.get(host + '/badger').end(function (err, res) {
                expect(res.status).to.equal(503);
                expect(res.header['retry-after']).to.equal('10');
                done();
        });
    });
});
