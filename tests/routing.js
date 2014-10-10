/* global describe, it, beforeEach, afterEach */
'use strict';

var request = require('superagent'),
    mocha = require('mocha'),
    nock = require('nock'),
    expect = require('chai').expect;

var mockProfiles = require('./fixtures/profile').getProfiles();
var mock = nock('http://next-service-registry.herokuapp.com').get('/services').reply(200, mockProfiles, {'Content-Type': 'application/json'});

describe('Router', function() {
    var app = require('../proxy');
    var host = 'http://localhost:5000',
        server;

    beforeEach(function () {
        server = app.listen(5000);
    });
    
    afterEach(function () {
        server.close();
    });

    describe('Service', function () {

        it('Respond with a success when requesting a valid service path', function (done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger').end(function (err, res) {
                    expect(res.status).to.equal(200);
                    expect(mock.isDone()).to.be.true;
                    done();
            });
        });
        
        it('Respond with a not found message when requesting an invalid service path', function (done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/four-oh-four').reply(404, '');
            request.get(host + '/four-oh-four').end(function (err, res) {
                    expect(res.status).to.equal(404);
                    done();
            });
        });

	it('Supports paths specified as arrays', function(done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/squirrel').reply(200, '');
            request.get(host + '/squirrel').end(function (err, res) {
                    expect(res.status).to.equal(200);
                    expect(mock.isDone()).to.be.true;
                    done();
            });
	});
        
        it('Vary by service version', function (done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger').end(function (err, res) {
                    expect(res.headers.vary).to.contain('X-Version');
                    expect(mock.isDone()).to.be.true;
                    done();
            });
        });
        
        it('Ensure the correctly formatted host header is sent to the proxied server', function (done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com')
                .matchHeader('host', 'next-router-test-app-badger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger').end(function (err, res) {
                    expect(res.status).to.equal(200);
                    expect(mock.isDone()).to.be.true;
                    done();
            });
        });
       
    });



    describe('Filter', function () {
    
        it('by version number', function (done) {
            var mock = nock('http://next-router-test-app-bodger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger')
                   .set('x-version', '#234')
                   .end(function (err, res) {
                      expect(res.header['x-version']).to.equal('#234');
                      expect(res.status).to.equal(200);
                      expect(mock.isDone()).to.be.true;
                      done();
            });
        });
        
        it('by user-agent', function (done) {
            var mock = nock('http://next-router-test-app-bodger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger')
                   .set('user-agent', 'Google Nexus 4.2')
                   .end(function (err, res) {
                      expect(res.header['x-version']).to.equal('#234');
                      expect(res.status).to.equal(200);
                      expect(mock.isDone()).to.be.true;
                      done();
            });
        });
        
        it('by x-headers', function (done) {
            var mock = nock('http://next-router-test-app-bodger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger')
                   .set('x-foo', 'hello')
                   .end(function (err, res) {
                      expect(res.header['x-version']).to.equal('#234');
                      expect(res.status).to.equal(200);
                      expect(mock.isDone()).to.be.true;
                      done();
            });
        });

	it('Routes for the home page', function(done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/').reply(200, '');
            request.get(host + '/').end(function (err, res) {
                    expect(res.status).to.equal(200);
                    expect(mock.isDone()).to.be.true;
                    done();
            });
	});
        
        it('Respond with a not found message when a specified filter does not exist', function (done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/badger').reply(404, '');
            request.get(host + '/badger')
                   .set('x-version', '999')
                   .end(function (err, res) {
                      expect(res.status).to.equal(404);
                      expect(mock.isDone()).to.be.true;
                      done();
            });
        });
      
    });
    
    describe('Help', function () {
        
        it('Display an about page', function (done) {
            request.get(host + '/__about').end(function (err, res) {
                    expect(res.status).to.equal(200);
                    done();
            });
        });

    });

});